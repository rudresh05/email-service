import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  JournalUpdateDataDto,
  PortfolioAcknowledgeDataDto,
  PortfolioContactDataDto,
  SendEmailDto,
  StreakAlertDataDto,
} from './dto/send-email.dto';
import {
  ErrorResponseDto,
  HealthCheckResponseDto,
  SendEmailResponseDto,
} from './dto/response.dto';
import { EmailService } from './email.service';

@ApiTags('Autonomous Email Service')
@ApiExtraModels(
  StreakAlertDataDto,
  PortfolioContactDataDto,
  PortfolioAcknowledgeDataDto,
  JournalUpdateDataDto,
  SendEmailResponseDto,
  HealthCheckResponseDto,
  ErrorResponseDto,
)
@Controller('api/emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('health')
  @ApiOperation({
    summary: 'SMTP & Microservice Health Status',
    description:
      'Performs real-time verification of the underlying SMTP connection pool and returns service diagnostics matching the HealthCheckResponseDto contract.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service and SMTP connection health details',
    type: HealthCheckResponseDto,
    example: {
      status: 'ok',
      service: 'Rudra Central Email Microservice',
      smtp: {
        healthy: true,
        message: 'SMTP connection verified successfully',
      },
      timestamp: '2026-09-20T19:40:00.000Z',
    },
  })
  async checkHealth(): Promise<HealthCheckResponseDto> {
    const smtpStatus = await this.emailService.verifyConnection();
    return {
      status: smtpStatus.healthy ? 'ok' : 'degraded',
      service: 'Rudra Central Email Microservice',
      smtp: smtpStatus,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('send')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('bearer-auth')
  @ApiHeader({
    name: 'x-api-key',
    description: 'Alternative header for API authentication',
    required: false,
  })
  @ApiOperation({
    summary: 'Send Email via Pre-configured Template or Custom Payload',
    description:
      'Zero-Fallback email dispatch. Strictly validates payloads against input contracts and returns typed output contracts. Select any example from the dropdown below to see all valid input fields for each template type.',
  })
  @ApiBody({
    type: SendEmailDto,
    description:
      'Send email payload. Select any template from the dropdown to load all corresponding input fields with ready-to-test data.',
    examples: {
      portfolioContact: {
        summary: '1. PORTFOLIO_CONTACT (Visitor Inquiry from Portfolio)',
        description:
          'Used by rudresh-portfolio contact form. Sends an admin alert to the portfolio owner and automatically sends an acknowledgment confirmation to the visitor.',
        value: {
          to: 'rudreshpatel504@gmail.com',
          type: 'PORTFOLIO_CONTACT',
          sender: 'PORTFOLIO',
          replyTo: 'visitor@example.com',
          subject: 'New Portfolio Message from Tanya Dubey',
          data: {
            visitorName: 'Tanya Dubey',
            visitorEmail: 'visitor@example.com',
            message: 'Hello Rudresh! I saw your portfolio and would like to discuss an autonomous software engineering project.',
            sendAutoReply: true,
          },
        },
      },
      portfolioAcknowledge: {
        summary: '2. PORTFOLIO_ACKNOWLEDGE (Auto-Reply Confirmation)',
        description:
          'Direct auto-reply confirmation sent to visitors informing them their message was received.',
        value: {
          to: 'visitor@example.com',
          type: 'PORTFOLIO_ACKNOWLEDGE',
          sender: 'PORTFOLIO',
          subject: 'Thanks for reaching out! — Rudresh Patel',
          data: {
            visitorName: 'Tanya Dubey',
            visitorEmail: 'visitor@example.com',
          },
        },
      },
      journalUpdate: {
        summary: '3. JOURNAL_UPDATE (Daily Operational Digest)',
        description:
          'Dispatches daily engineering metrics, logged work, revenue, wins, and next-day non-negotiables.',
        value: {
          to: 'rudreshpatel504@gmail.com',
          type: 'JOURNAL_UPDATE',
          sender: 'PORTFOLIO',
          subject: 'Journal Update // 20 SEPT 2026',
          data: {
            date: '20 SEPT 2026',
            deepWorkHours: '6.5h',
            revenue: 'Rs 15,000',
            networking: '3 calls',
            codingCompleted: 'Engineered NestJS Central Email Gateway & Swagger OpenAPI documentation',
            workCompleted: 'Drafted architecture specs and separated template views',
            wins: '100% self-hosted zero-cost operation, zero third-party SaaS reliance',
            nonNegotiable1: 'Deploy microservice to Render cloud environment',
            nonNegotiable2: 'Connect DNS MX & SPF records for custom domain',
            nonNegotiable3: 'Wire portfolio contact form directly to gateway API',
            futureSentence: 'Compounding software velocity daily without friction.',
          },
        },
      },
      streakAlert: {
        summary: '4. STREAK_ALERT (LeetCode Streak Danger Alert)',
        description:
          'Urgent notification triggered by Syntra / leetcode_to_github when daily streak is close to expiring.',
        value: {
          to: 'rudreshpatel504@gmail.com',
          type: 'STREAK_ALERT',
          sender: 'SYNTRA',
          subject: 'Alert: Your 15-Day LeetCode Streak is in Danger!',
          data: {
            userName: 'Rudresh',
            currentStreak: 15,
            hoursLeft: 4,
            solveUrl: 'https://leetcode.com/problemset',
            targetDate: '2026-09-20',
          },
        },
      },
      customRaw: {
        summary: '5. CUSTOM_RAW (Custom HTML & Plaintext)',
        description:
          'Freeform email with custom subject line, custom HTML formatting, and plaintext fallback.',
        value: {
          to: 'recipient@example.com',
          type: 'CUSTOM_RAW',
          sender: 'DEFAULT',
          subject: 'Custom Announcement // System Update',
          html: '<div style="font-family: Arial, sans-serif; padding: 24px; background: #111827; color: #f3f4f6; border-radius: 8px;"><h2>System Announcement</h2><p>Custom notification payload dispatched directly via SMTP.</p></div>',
          text: 'System Announcement\n\nCustom notification payload dispatched directly via SMTP.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email successfully accepted and delivered via SMTP',
    type: SendEmailResponseDto,
    example: {
      success: true,
      data: {
        messageId: '<d48f52d3-85dc-d1e5-2d11-fc71a1b90019@gmail.com>',
        recipient: 'rudreshpatel504@gmail.com',
        sender: 'rudreshpatel504@gmail.com',
        type: 'PORTFOLIO_CONTACT',
        autoReplyDelivered: true,
        autoReplyMessageId: '<ack-77a88b-112@gmail.com>',
        timestamp: '2026-09-20T19:40:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Input Contract Violation / Validation Failures',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: {
        statusCode: 400,
        error: 'Bad Request',
        message: [
          'to must be a valid email address',
          'type must be one of: STREAK_ALERT, PORTFOLIO_CONTACT, PORTFOLIO_ACKNOWLEDGE, JOURNAL_UPDATE, CUSTOM_RAW',
        ],
        timestamp: '2026-09-20T19:40:10.000Z',
        path: '/api/emails/send',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized: Missing or invalid API secret key',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: {
        statusCode: 401,
        error: 'Unauthorized',
        message:
          'Unauthorized: Missing or invalid API secret key. Provide Authorization: Bearer <token> or x-api-key header.',
        timestamp: '2026-09-20T19:40:15.000Z',
        path: '/api/emails/send',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'SMTP delivery failure / Server error',
    type: ErrorResponseDto,
    example: {
      success: false,
      error: {
        statusCode: 500,
        error: 'Internal Server Error',
        message:
          '[SMTP Delivery Error] Failed to send email to recipient@example.com: Invalid login: 535-5.7.8 Username and Password not accepted',
        timestamp: '2026-09-20T19:40:20.000Z',
        path: '/api/emails/send',
      },
    },
  })
  async sendEmail(
    @Body() sendEmailDto: SendEmailDto,
  ): Promise<SendEmailResponseDto> {
    return this.emailService.sendEmail(sendEmailDto);
  }
}
