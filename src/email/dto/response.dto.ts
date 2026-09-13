import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailTemplateType } from './send-email.dto';

// ==========================================
// 1. Email Delivery Output Contracts
// ==========================================

export class SendEmailSuccessDataDto {
  @ApiProperty({
    example: '<55496cd8-dcd5-4922-40ff-0385a1323142@rudreshp.me>',
    description: 'Unique message identifier assigned by the SMTP server',
  })
  messageId: string;

  @ApiProperty({
    example: 'rudreshpatel504@gmail.com',
    description: 'Target recipient email address',
  })
  recipient: string;

  @ApiProperty({
    example: 'rudreshpatel504@gmail.com',
    description: 'Sender email identity used for dispatch',
  })
  sender: string;

  @ApiProperty({
    enum: EmailTemplateType,
    example: EmailTemplateType.STREAK_ALERT,
    description: 'The template type that was processed and delivered',
  })
  type: EmailTemplateType;

  @ApiPropertyOptional({
    example: 'https://ethereal.email/message/Wa3n5...',
    description: 'Live web preview URL for the primary email',
  })
  previewUrl?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether an automated acknowledgment reply was dispatched to the visitor',
  })
  autoReplyDelivered?: boolean;

  @ApiPropertyOptional({
    example: '<77a88b-112@rudreshp.me>',
    description: 'Message identifier of the automated acknowledgment reply',
  })
  autoReplyMessageId?: string;

  @ApiPropertyOptional({
    example: 'https://ethereal.email/message/AutoReply...',
    description: 'Live web preview URL for the auto-reply email',
  })
  autoReplyPreviewUrl?: string;

  @ApiProperty({
    example: '2026-09-13T12:35:00.000Z',
    description: 'ISO 8601 timestamp of when the email was accepted by SMTP transport',
  })
  timestamp: string;
}

export class SendEmailResponseDto {
  @ApiProperty({ example: true, description: 'Indicates successful delivery' })
  success: boolean;

  @ApiProperty({
    type: SendEmailSuccessDataDto,
    description: 'Delivery metadata payload',
  })
  data: SendEmailSuccessDataDto;
}

// ==========================================
// 2. Health Check Output Contracts
// ==========================================

export class SmtpDiagnosticsDto {
  @ApiProperty({ example: true, description: 'Whether the SMTP handshake and login succeeded' })
  healthy: boolean;

  @ApiProperty({
    example: 'SMTP connection verified successfully',
    description: 'Detailed connection status or diagnostic message',
  })
  message: string;
}

export class HealthCheckResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded'], description: 'Overall microservice operational status' })
  status: 'ok' | 'degraded';

  @ApiProperty({ example: 'Rudra Central Email Microservice', description: 'Service name identifier' })
  service: string;

  @ApiProperty({ type: SmtpDiagnosticsDto, description: 'SMTP connection pool status' })
  smtp: SmtpDiagnosticsDto;

  @ApiProperty({ example: '2026-09-13T12:35:00.000Z', description: 'ISO 8601 timestamp of health check' })
  timestamp: string;
}

// ==========================================
// 3. Error Output Contracts
// ==========================================

export class ErrorDetailsDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request', description: 'HTTP error type' })
  error: string;

  @ApiProperty({
    example: ['to must be a valid email address', 'currentStreak must be a valid number'],
    description: 'Actionable error description or validation failures list',
    oneOf: [
      { type: 'string' },
      { type: 'array', items: { type: 'string' } },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: '2026-09-13T12:35:00.000Z', description: 'ISO 8601 timestamp of error' })
  timestamp: string;

  @ApiProperty({ example: '/api/emails/send', description: 'Request endpoint path where error occurred' })
  path: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: false, description: 'Always false for error responses' })
  success: boolean;

  @ApiProperty({ type: ErrorDetailsDto, description: 'Structured error diagnostics' })
  error: ErrorDetailsDto;
}
