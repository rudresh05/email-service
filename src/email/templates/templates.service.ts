import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  EmailTemplateType,
  JournalUpdateDataDto,
  PortfolioAcknowledgeDataDto,
  PortfolioContactDataDto,
  StreakAlertDataDto,
} from '../dto/send-email.dto';

@Injectable()
export class TemplatesService implements OnModuleInit {
  private readonly logger = new Logger(TemplatesService.name);
  private templateCache = new Map<string, string>();

  onModuleInit() {
    this.preloadTemplates();
  }

  /**
   * Preloads HTML templates into memory for high-performance zero-lag rendering.
   */
  private preloadTemplates() {
    const templates = [
      'streak-alert.html',
      'portfolio-contact.html',
      'portfolio-acknowledge.html',
      'journal-update.html',
    ];

    for (const file of templates) {
      try {
        const content = this.readTemplateFile(file);
        this.templateCache.set(file, content);
        this.logger.log(`Loaded template file: ${file}`);
      } catch (err: any) {
        this.logger.warn(`Could not preload ${file}: ${err.message}. Will attempt on-demand load.`);
      }
    }
  }

  /**
   * Resolves and reads HTML template from filesystem, checking dist and src paths.
   */
  private readTemplateFile(fileName: string): string {
    if (this.templateCache.has(fileName)) {
      return this.templateCache.get(fileName)!;
    }

    const candidatePaths = [
      path.join(__dirname, 'html', fileName),
      path.join(process.cwd(), 'src', 'email', 'templates', 'html', fileName),
      path.join(process.cwd(), 'dist', 'email', 'templates', 'html', fileName),
    ];

    for (const filePath of candidatePaths) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        this.templateCache.set(fileName, content);
        return content;
      }
    }

    throw new Error(`Template file "${fileName}" could not be located in candidate paths.`);
  }

  /**
   * Interpolates dynamic variables into {{placeholder}} tags in the HTML template.
   */
  private interpolate(templateHtml: string, variables: Record<string, string | number>): string {
    let result = templateHtml;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  /**
   * Zero-Fallback Template Renderer.
   * Reads external HTML templates and validates inputs strictly.
   */
  render(
    type: EmailTemplateType,
    data?: any,
    customSubject?: string,
    customHtml?: string,
    customText?: string,
  ): { subject: string; html: string; text: string } {
    switch (type) {
      case EmailTemplateType.STREAK_ALERT:
        return this.renderStreakAlert(data);

      case EmailTemplateType.PORTFOLIO_CONTACT:
        return this.renderPortfolioContact(data);

      case EmailTemplateType.PORTFOLIO_ACKNOWLEDGE:
        return this.renderPortfolioAcknowledge(data);

      case EmailTemplateType.JOURNAL_UPDATE:
        return this.renderJournalUpdate(data);

      case EmailTemplateType.CUSTOM_RAW:
        return this.renderCustomRaw(customSubject, customHtml, customText);

      default:
        throw new BadRequestException(
          `[Zero Fallback Violation] Unsupported or invalid template type: "${type}". Allowed types: STREAK_ALERT, PORTFOLIO_CONTACT, PORTFOLIO_ACKNOWLEDGE, JOURNAL_UPDATE, CUSTOM_RAW`,
        );
    }
  }

  private renderStreakAlert(data: StreakAlertDataDto) {
    if (!data) {
      throw new BadRequestException(
        '[Zero Fallback Violation] Missing "data" payload for STREAK_ALERT template',
      );
    }
    if (!data.userName || typeof data.userName !== 'string' || !data.userName.trim()) {
      throw new BadRequestException(
        '[Zero Fallback Violation] "data.userName" is strictly required and cannot be empty for STREAK_ALERT',
      );
    }
    if (data.currentStreak === undefined || data.currentStreak === null || typeof data.currentStreak !== 'number' || data.currentStreak < 1) {
      throw new BadRequestException(
        '[Zero Fallback Violation] "data.currentStreak" is strictly required and must be a number >= 1 for STREAK_ALERT',
      );
    }

    const { userName, currentStreak, hoursLeft, solveUrl, targetDate } = data;
    const hours = hoursLeft ?? 4;
    const url = solveUrl || 'https://leetcode.com/problemset';
    const targetBadge = targetDate ? `// ${targetDate}` : '';

    const rawHtml = this.readTemplateFile('streak-alert.html');
    const html = this.interpolate(rawHtml, {
      userName,
      currentStreak,
      hoursLeft: hours,
      solveUrl: url,
      targetDateBadge: targetBadge,
    });

    const subject = `Alert: Your ${currentStreak}-Day LeetCode Streak is in Danger!`;
    const text = `Hey ${userName},\nYour ${currentStreak}-day LeetCode streak is about to break! You have ${hours} hours left to solve a problem: ${url}`;
    return { subject, html, text };
  }

  private renderPortfolioContact(data: PortfolioContactDataDto) {
    if (!data) {
      throw new BadRequestException(
        '[Zero Fallback Violation] Missing "data" payload for PORTFOLIO_CONTACT template',
      );
    }
    if (!data.visitorName || !data.visitorName.trim()) {
      throw new BadRequestException(
        '[Zero Fallback Violation] "data.visitorName" is strictly required for PORTFOLIO_CONTACT',
      );
    }
    if (!data.visitorEmail || !data.visitorEmail.trim()) {
      throw new BadRequestException(
        '[Zero Fallback Violation] "data.visitorEmail" is strictly required for PORTFOLIO_CONTACT',
      );
    }
    if (!data.message || !data.message.trim()) {
      throw new BadRequestException(
        '[Zero Fallback Violation] "data.message" is strictly required for PORTFOLIO_CONTACT',
      );
    }

    const { visitorName, visitorEmail, message } = data;
    const rawHtml = this.readTemplateFile('portfolio-contact.html');
    const html = this.interpolate(rawHtml, {
      visitorName,
      visitorEmail,
      message,
    });

    const subject = `New Portfolio Message from ${visitorName}`;
    const text = `New Portfolio Inquiry from ${visitorName} (${visitorEmail}):\n\n${message}`;
    return { subject, html, text };
  }

  private renderPortfolioAcknowledge(data: PortfolioAcknowledgeDataDto) {
    if (!data) {
      throw new BadRequestException(
        '[Zero Fallback Violation] Missing "data" payload for PORTFOLIO_ACKNOWLEDGE template',
      );
    }
    if (!data.visitorName || !data.visitorName.trim()) {
      throw new BadRequestException(
        '[Zero Fallback Violation] "data.visitorName" is strictly required for PORTFOLIO_ACKNOWLEDGE',
      );
    }
    if (!data.visitorEmail || !data.visitorEmail.trim()) {
      throw new BadRequestException(
        '[Zero Fallback Violation] "data.visitorEmail" is strictly required for PORTFOLIO_ACKNOWLEDGE',
      );
    }

    const { visitorName, messageExcerpt } = data;
    const excerptHtml = messageExcerpt
      ? `<div class="card"><div class="card-title">Message Summary</div><p class="card-text">${messageExcerpt}</p></div>`
      : '';

    const rawHtml = this.readTemplateFile('portfolio-acknowledge.html');
    const html = this.interpolate(rawHtml, {
      visitorName,
      messageExcerptBox: excerptHtml,
    });

    const subject = `Thank you for reaching out, ${visitorName} [Rudresh Patel]`;
    const text = `Dear ${visitorName},\n\nThank you for reaching out through my portfolio. Your inquiry has been delivered and I will get back to you within 24 hours.\n\nBest regards,\nRudresh Patel\nhttps://rudreshp.me`;
    return { subject, html, text };
  }

  private renderJournalUpdate(data: JournalUpdateDataDto) {
    if (!data) {
      throw new BadRequestException(
        '[Zero Fallback Violation] Missing "data" payload for JOURNAL_UPDATE template',
      );
    }
    if (!data.date || !data.date.trim()) {
      throw new BadRequestException(
        '[Zero Fallback Violation] "data.date" is strictly required for JOURNAL_UPDATE',
      );
    }

    const {
      date,
      deepWorkHours = '0h',
      revenue = 'Rs 0',
      networking = '0',
      codingCompleted = 'System baseline maintained.',
      workCompleted = 'Routine processing.',
      wins = 'Compounding output.',
      nonNegotiable1 = 'Pending initialization.',
      nonNegotiable2 = 'Pending initialization.',
      nonNegotiable3 = 'Pending initialization.',
      futureSentence = 'Moving forward without friction.',
    } = data;

    const rawHtml = this.readTemplateFile('journal-update.html');
    const html = this.interpolate(rawHtml, {
      date,
      deepWorkHours,
      revenue,
      networking,
      codingCompleted,
      workCompleted,
      wins,
      nonNegotiable1,
      nonNegotiable2,
      nonNegotiable3,
      futureSentence,
    });

    const subject = `Journal Update // ${date}`;
    const text = `Journal Update // ${date}\nFlow: ${deepWorkHours}\nAssets: ${revenue}\nWins: ${wins}`;
    return { subject, html, text };
  }

  private renderCustomRaw(customSubject?: string, customHtml?: string, customText?: string) {
    if (!customSubject || !customSubject.trim()) {
      throw new BadRequestException(
        '[Zero Fallback Violation] "subject" is strictly required when using template type CUSTOM_RAW',
      );
    }
    if ((!customHtml || !customHtml.trim()) && (!customText || !customText.trim())) {
      throw new BadRequestException(
        '[Zero Fallback Violation] At least one of "html" or "text" must be provided when using template type CUSTOM_RAW',
      );
    }

    const html = customHtml || `<p>${customText}</p>`;
    const text = customText || (customHtml ? customHtml.replace(/<[^>]*>?/gm, '') : '');

    return {
      subject: customSubject,
      html,
      text,
    };
  }
}
