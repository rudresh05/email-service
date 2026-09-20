import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { EmailService } from '../email/email.service';
import { EmailTemplateType } from '../email/dto/send-email.dto';
import { SubmitContactDto } from './dto/submit-contact.dto';

@ApiTags('Public Contact Portal')
@Controller()
export class ContactController {
  private readonly logger = new Logger(ContactController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  @Get(['', 'contact'])
  @ApiOperation({
    summary: 'Serve Standalone Contact Web Portal',
    description:
      'Serves the standalone, responsive dark-themed contact page UI. Supports embedding via iframe and ?project= query parameters.',
  })
  serveContactPage(@Res() res: Response) {
    const candidatePaths = [
      path.join(process.cwd(), 'public', 'index.html'),
      path.join(__dirname, '..', '..', 'public', 'index.html'),
      path.join(__dirname, '..', 'public', 'index.html'),
    ];

    for (const filePath of candidatePaths) {
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }

    return res.status(HttpStatus.NOT_FOUND).send('Contact page not found');
  }

  @Post('api/contact/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public Contact Form Submission',
    description:
      'Public endpoint called directly from the contact web page. Includes bot honeypot protection, routes admin alert to owner, and sends confirmation auto-reply to the visitor.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Inquiry successfully submitted and queued for delivery',
    schema: {
      example: {
        success: true,
        message:
          'Message delivered successfully! A confirmation auto-reply has been sent to your inbox.',
      },
    },
  })
  async submitContactForm(@Body() dto: SubmitContactDto) {
    // 1. Bot Honeypot Check
    if (dto.website_hp && dto.website_hp.trim().length > 0) {
      this.logger.warn(
        `[Anti-Spam Gateway] Bot submission detected and dropped silently. (HP: ${dto.website_hp})`,
      );
      return {
        success: true,
        message: 'Message processed successfully.',
      };
    }

    // 2. Resolve Destination (Owner)
    const ownerEmail =
      this.configService.get<string>('PORTFOLIO_EMAIL') ||
      this.configService.get<string>('SMTP_USER') ||
      'rudreshpatel504@gmail.com';

    const projectTag = dto.project ? `[${dto.project}] ` : '';
    const formattedMessage = dto.project
      ? `[Source: ${dto.project}]\n\n${dto.message}`
      : dto.message;

    this.logger.log(
      `Public contact inquiry from "${dto.visitorName}" (${dto.visitorEmail}) for project: "${dto.project || 'General'}"`,
    );

    // 3. Dispatch via Email Service
    await this.emailService.sendEmail({
      type: EmailTemplateType.PORTFOLIO_CONTACT,
      to: ownerEmail,
      replyTo: dto.visitorEmail,
      subject: `${projectTag}New Message from ${dto.visitorName}`,
      data: {
        visitorName: dto.visitorName,
        visitorEmail: dto.visitorEmail,
        message: formattedMessage,
        sendAutoReply: true,
      },
    });

    return {
      success: true,
      message:
        'Message delivered successfully! A confirmation auto-reply has been sent to your inbox.',
    };
  }
}
