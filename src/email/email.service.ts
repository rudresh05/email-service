import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  EmailTemplateType,
  PortfolioContactDataDto,
  SendEmailDto,
  SenderProfile,
} from './dto/send-email.dto';
import {
  SendEmailResponseDto,
  SmtpDiagnosticsDto,
} from './dto/response.dto';
import { TemplatesService } from './templates/templates.service';

interface SenderIdentity {
  transporter: nodemailer.Transporter;
  fromName: string;
  fromEmail: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private primaryTransporter: nodemailer.Transporter;
  private identities = new Map<SenderProfile, SenderIdentity>();

  constructor(
    private readonly configService: ConfigService,
    private readonly templatesService: TemplatesService,
  ) {}

  onModuleInit() {
    this.initTransporters();
  }

  private createTransporter(user?: string, pass?: string, host?: string, port?: number, secure?: boolean) {
    const defaultHost = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const defaultPort = Number(this.configService.get<number>('SMTP_PORT', 587));
    const defaultSecure = this.configService.get<string>('SMTP_SECURE', 'false') === 'true';

    return nodemailer.createTransport({
      host: host || defaultHost,
      port: port || defaultPort,
      secure: secure !== undefined ? secure : defaultSecure,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: user && pass ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private initTransporters() {
    const primaryUser = this.configService.get<string>('SMTP_USER');
    const primaryPass = this.configService.get<string>('SMTP_PASS');

    if (!primaryUser || !primaryPass) {
      this.logger.warn(
        '[Zero Fallback Notice] SMTP_USER or SMTP_PASS is missing in environment variables. Email dispatch will be rejected until configured.',
      );
    }

    this.primaryTransporter = this.createTransporter(primaryUser, primaryPass);

    // 1. DEFAULT Profile
    const defaultFromName = this.configService.get<string>('DEFAULT_FROM_NAME', 'Rudresh Patel');
    const defaultFromEmail = this.configService.get<string>('DEFAULT_FROM_EMAIL', primaryUser || 'updates@rudreshp.me');
    this.identities.set(SenderProfile.DEFAULT, {
      transporter: this.primaryTransporter,
      fromName: defaultFromName,
      fromEmail: defaultFromEmail,
    });

    // 2. PORTFOLIO Profile
    const portfolioUser = this.configService.get<string>('PORTFOLIO_EMAIL') || primaryUser;
    const portfolioPass = this.configService.get<string>('PORTFOLIO_APP_PASS') || primaryPass;
    const portfolioName = this.configService.get<string>('PORTFOLIO_FROM_NAME', 'Rudresh Patel');
    const portfolioTransporter = (portfolioUser && portfolioPass)
      ? this.createTransporter(portfolioUser, portfolioPass)
      : this.primaryTransporter;

    this.identities.set(SenderProfile.PORTFOLIO, {
      transporter: portfolioTransporter,
      fromName: portfolioName,
      fromEmail: portfolioUser || defaultFromEmail,
    });

    // 3. SYNTRA Profile (LeetCode to GitHub)
    const syntraUser = this.configService.get<string>('SYNTRA_EMAIL');
    const syntraPass = this.configService.get<string>('SYNTRA_APP_PASS');
    const syntraName = this.configService.get<string>('SYNTRA_FROM_NAME', 'Syntra | LeetCode Streak');
    const syntraTransporter = (syntraUser && syntraPass)
      ? this.createTransporter(syntraUser, syntraPass)
      : this.primaryTransporter;

    this.identities.set(SenderProfile.SYNTRA, {
      transporter: syntraTransporter,
      fromName: syntraName,
      fromEmail: syntraUser || portfolioUser || defaultFromEmail,
    });

    this.logger.log('Transporter Registry initialized with identities: [PORTFOLIO, SYNTRA, DEFAULT]');
  }

  private resolveSender(dto: SendEmailDto): { identity: SenderIdentity; profile: SenderProfile } {
    let targetProfile = dto.sender;

    if (!targetProfile) {
      if (dto.type === EmailTemplateType.STREAK_ALERT) {
        targetProfile = SenderProfile.SYNTRA;
      } else {
        targetProfile = SenderProfile.PORTFOLIO;
      }
    }

    const identity = this.identities.get(targetProfile) || this.identities.get(SenderProfile.DEFAULT);
    return { identity, profile: targetProfile };
  }

  async verifyConnection(): Promise<SmtpDiagnosticsDto> {
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('PORTFOLIO_EMAIL');
    const pass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('PORTFOLIO_APP_PASS');

    if (!user || !pass) {
      return {
        healthy: false,
        message: 'SMTP credentials missing (SMTP_USER / SMTP_PASS not set)',
      };
    }

    try {
      await this.primaryTransporter.verify();
      return { healthy: true, message: 'SMTP connection verified successfully' };
    } catch (err: any) {
      this.logger.error(`SMTP Verification Failed: ${err.message}`);
      return { healthy: false, message: err.message };
    }
  }

  async sendEmail(dto: SendEmailDto): Promise<SendEmailResponseDto> {
    const { identity, profile } = this.resolveSender(dto);

    // Zero-fallback enforcement: Ensure active transporter credentials
    const user = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('PORTFOLIO_EMAIL');
    const pass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('PORTFOLIO_APP_PASS');

    if (!user || !pass) {
      throw new InternalServerErrorException(
        '[Zero Fallback Violation] Cannot send email: SMTP credentials are not configured in the server environment.',
      );
    }

    // Render primary email template
    const { subject, html, text } = this.templatesService.render(
      dto.type,
      dto.data,
      dto.subject,
      dto.html,
      dto.text,
    );

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${identity.fromName}" <${identity.fromEmail}>`,
      to: dto.to,
      replyTo: dto.replyTo || identity.fromEmail,
      subject,
      html,
      text,
    };

    try {
      this.logger.log(`Dispatching email [${dto.type}] via [${profile}] to: ${dto.to}`);
      const info = await identity.transporter.sendMail(mailOptions);
      this.logger.log(`Email successfully delivered. MessageId: ${info.messageId}`);

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`Email Preview URL: ${previewUrl}`);
      }

      // Handle Automated Auto-Reply for Portfolio Contact Submissions
      let autoReplyDelivered = false;
      let autoReplyMessageId: string | undefined;
      let autoReplyPreviewUrl: string | undefined;

      if (
        dto.type === EmailTemplateType.PORTFOLIO_CONTACT &&
        dto.data &&
        (dto.data as PortfolioContactDataDto).sendAutoReply !== false
      ) {
        const contactData = dto.data as PortfolioContactDataDto;
        try {
          this.logger.log(`Dispatching automated acknowledgment reply to visitor: ${contactData.visitorEmail}`);

          const ackRendered = this.templatesService.render(
            EmailTemplateType.PORTFOLIO_ACKNOWLEDGE,
            {
              visitorName: contactData.visitorName,
              visitorEmail: contactData.visitorEmail,
              messageExcerpt: contactData.message.length > 120 ? contactData.message.slice(0, 120) + '...' : contactData.message,
            },
          );

          const autoReplyOptions: nodemailer.SendMailOptions = {
            from: `"${identity.fromName}" <${identity.fromEmail}>`,
            to: contactData.visitorEmail,
            replyTo: identity.fromEmail,
            subject: ackRendered.subject,
            html: ackRendered.html,
            text: ackRendered.text,
          };

          const ackInfo = await identity.transporter.sendMail(autoReplyOptions);
          autoReplyDelivered = true;
          autoReplyMessageId = ackInfo.messageId;

          const ackPreview = nodemailer.getTestMessageUrl(ackInfo);
          if (ackPreview) {
            autoReplyPreviewUrl = ackPreview;
            this.logger.log(`Auto-Reply Preview URL: ${ackPreview}`);
          }
          this.logger.log(`Auto-Reply successfully delivered to visitor [${contactData.visitorEmail}]. MessageId: ${ackInfo.messageId}`);
        } catch (ackError: any) {
          this.logger.warn(`Failed to dispatch auto-reply to ${contactData.visitorEmail}: ${ackError.message}`);
        }
      }

      return {
        success: true,
        data: {
          messageId: info.messageId,
          recipient: dto.to,
          sender: identity.fromEmail,
          type: dto.type,
          previewUrl: previewUrl || undefined,
          autoReplyDelivered: autoReplyDelivered || undefined,
          autoReplyMessageId,
          autoReplyPreviewUrl,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to deliver email to ${dto.to}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        `[SMTP Delivery Error] Failed to send email to ${dto.to}: ${error.message}`,
      );
    }
  }
}
