import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';

export enum EmailTemplateType {
  STREAK_ALERT = 'STREAK_ALERT',
  PORTFOLIO_CONTACT = 'PORTFOLIO_CONTACT',
  PORTFOLIO_ACKNOWLEDGE = 'PORTFOLIO_ACKNOWLEDGE',
  JOURNAL_UPDATE = 'JOURNAL_UPDATE',
  CUSTOM_RAW = 'CUSTOM_RAW',
}

export enum SenderProfile {
  PORTFOLIO = 'PORTFOLIO',
  SYNTRA = 'SYNTRA',
  DEFAULT = 'DEFAULT',
}

// ==========================================
// 1. Template Input Sub-Contracts
// ==========================================

export class StreakAlertDataDto {
  @ApiProperty({ example: 'Rudresh', description: 'Name of the user' })
  @IsString({ message: 'userName must be a string' })
  @IsNotEmpty({ message: 'userName is strictly required for STREAK_ALERT' })
  userName: string;

  @ApiProperty({ example: 15, description: 'Current active streak count in days (min 1)' })
  @IsNumber({}, { message: 'currentStreak must be a valid number' })
  @Min(1, { message: 'currentStreak must be at least 1' })
  currentStreak: number;

  @ApiPropertyOptional({ example: 4, description: 'Hours remaining before streak resets' })
  @IsOptional()
  @IsNumber({}, { message: 'hoursLeft must be a number' })
  hoursLeft?: number;

  @ApiPropertyOptional({ example: 'https://leetcode.com/problemset', description: 'Direct CTA URL' })
  @IsOptional()
  @IsString({ message: 'solveUrl must be a valid URL string' })
  solveUrl?: string;

  @ApiPropertyOptional({ example: '2026-09-13', description: 'Target evaluation date' })
  @IsOptional()
  @IsString({ message: 'targetDate must be a string' })
  targetDate?: string;
}

export class PortfolioContactDataDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the portfolio visitor' })
  @IsString({ message: 'visitorName must be a string' })
  @IsNotEmpty({ message: 'visitorName is strictly required for PORTFOLIO_CONTACT' })
  visitorName: string;

  @ApiProperty({ example: 'johndoe@example.com', description: 'Email of the portfolio visitor' })
  @IsEmail({}, { message: 'visitorEmail must be a valid email address' })
  @IsNotEmpty({ message: 'visitorEmail is strictly required for PORTFOLIO_CONTACT' })
  visitorEmail: string;

  @ApiProperty({ example: 'Hey Rudresh, I want to discuss a full-stack project.', description: 'Message body' })
  @IsString({ message: 'message must be a string' })
  @IsNotEmpty({ message: 'message content is strictly required for PORTFOLIO_CONTACT' })
  message: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to automatically send a confirmation auto-reply to the visitor (default: true)',
  })
  @IsOptional()
  @IsBoolean({ message: 'sendAutoReply must be a boolean' })
  sendAutoReply?: boolean;
}

export class PortfolioAcknowledgeDataDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the portfolio visitor' })
  @IsString({ message: 'visitorName must be a string' })
  @IsNotEmpty({ message: 'visitorName is strictly required for PORTFOLIO_ACKNOWLEDGE' })
  visitorName: string;

  @ApiProperty({ example: 'johndoe@example.com', description: 'Email of the portfolio visitor' })
  @IsEmail({}, { message: 'visitorEmail must be a valid email address' })
  @IsNotEmpty({ message: 'visitorEmail is strictly required for PORTFOLIO_ACKNOWLEDGE' })
  visitorEmail: string;

  @ApiPropertyOptional({ example: 'Hey Rudresh, discussing a project.', description: 'Summary excerpt of the inquiry' })
  @IsOptional()
  @IsString({ message: 'messageExcerpt must be a string' })
  messageExcerpt?: string;
}

export class JournalUpdateDataDto {
  @ApiProperty({ example: '13 SEPT 2026', description: 'Journal entry date label' })
  @IsString({ message: 'date must be a string' })
  @IsNotEmpty({ message: 'date is strictly required for JOURNAL_UPDATE' })
  date: string;

  @ApiPropertyOptional({ example: '6.5h', description: 'Deep work / focus hours' })
  @IsOptional()
  @IsString({ message: 'deepWorkHours must be a string' })
  deepWorkHours?: string;

  @ApiPropertyOptional({ example: 'Rs 15,000', description: 'Revenue metrics logged' })
  @IsOptional()
  @IsString({ message: 'revenue must be a string' })
  revenue?: string;

  @ApiPropertyOptional({ example: '3 calls', description: 'Networking / growth metric' })
  @IsOptional()
  @IsString({ message: 'networking must be a string' })
  networking?: string;

  @ApiPropertyOptional({ example: 'Engineered NestJS Email Microservice', description: 'Engineering shipments' })
  @IsOptional()
  @IsString({ message: 'codingCompleted must be a string' })
  codingCompleted?: string;

  @ApiPropertyOptional({ example: 'Completed architecture documentation and Swagger setup', description: 'Strategic log' })
  @IsOptional()
  @IsString({ message: 'workCompleted must be a string' })
  workCompleted?: string;

  @ApiPropertyOptional({ example: '100% self-hosted, zero reliance on Resend', description: 'Major outcome / wins' })
  @IsOptional()
  @IsString({ message: 'wins must be a string' })
  wins?: string;

  @ApiPropertyOptional({ example: 'Deploy to Render', description: 'Directive 1' })
  @IsOptional()
  @IsString({ message: 'nonNegotiable1 must be a string' })
  nonNegotiable1?: string;

  @ApiPropertyOptional({ example: 'Set up DNS records', description: 'Directive 2' })
  @IsOptional()
  @IsString({ message: 'nonNegotiable2 must be a string' })
  nonNegotiable2?: string;

  @ApiPropertyOptional({ example: 'Connect to portfolio contact form', description: 'Directive 3' })
  @IsOptional()
  @IsString({ message: 'nonNegotiable3 must be a string' })
  nonNegotiable3?: string;

  @ApiPropertyOptional({ example: 'Compounding software velocity daily.', description: 'Core guiding truth' })
  @IsOptional()
  @IsString({ message: 'futureSentence must be a string' })
  futureSentence?: string;
}

// ==========================================
// 2. Primary Root Input Contract
// ==========================================

@ApiExtraModels(
  StreakAlertDataDto,
  PortfolioContactDataDto,
  PortfolioAcknowledgeDataDto,
  JournalUpdateDataDto,
)
export class SendEmailDto {
  @ApiProperty({
    example: 'rudreshpatel504@gmail.com',
    description: 'Target recipient email address',
  })
  @IsEmail({}, { message: 'to must be a valid email address' })
  @IsNotEmpty({ message: 'Recipient email (to) is strictly required' })
  to: string;

  @ApiProperty({
    enum: EmailTemplateType,
    example: EmailTemplateType.STREAK_ALERT,
    description: 'Template identifier to use for rendering',
  })
  @IsEnum(EmailTemplateType, {
    message:
      'type must be one of: STREAK_ALERT, PORTFOLIO_CONTACT, PORTFOLIO_ACKNOWLEDGE, JOURNAL_UPDATE, CUSTOM_RAW',
  })
  @IsNotEmpty({ message: 'Template type is strictly required' })
  type: EmailTemplateType;

  @ApiPropertyOptional({
    enum: SenderProfile,
    example: SenderProfile.PORTFOLIO,
    description:
      'Sender identity profile (PORTFOLIO, SYNTRA, or DEFAULT). If omitted, automatically determined from the template type.',
  })
  @IsOptional()
  @IsEnum(SenderProfile, {
    message: 'sender must be one of: PORTFOLIO, SYNTRA, DEFAULT',
  })
  sender?: SenderProfile;

  @ApiPropertyOptional({
    example: 'visitor@example.com',
    description: 'Reply-To email header (recommended for portfolio inquiries)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'replyTo must be a valid email address' })
  replyTo?: string;

  @ApiPropertyOptional({
    example: 'Custom Subject Line',
    description: 'Custom subject line (Mandatory if type is CUSTOM_RAW)',
  })
  @IsOptional()
  @IsString({ message: 'subject must be a string' })
  subject?: string;

  @ApiPropertyOptional({
    example: 'Plain text message content fallback',
    description: 'Plain text fallback',
  })
  @IsOptional()
  @IsString({ message: 'text must be a string' })
  text?: string;

  @ApiPropertyOptional({
    example: '<h1>Custom HTML Content</h1>',
    description: 'HTML body (Mandatory if type is CUSTOM_RAW)',
  })
  @IsOptional()
  @IsString({ message: 'html must be a string' })
  html?: string;

  @ApiPropertyOptional({
    description:
      'Polymorphic data payload dynamically validated against the chosen template type schema',
    oneOf: [
      { $ref: getSchemaPath(StreakAlertDataDto) },
      { $ref: getSchemaPath(PortfolioContactDataDto) },
      { $ref: getSchemaPath(PortfolioAcknowledgeDataDto) },
      { $ref: getSchemaPath(JournalUpdateDataDto) },
    ],
  })
  @IsOptional()
  @ValidateNested()
  @Type((options) => {
    const type = options?.newObject?.type;
    switch (type) {
      case EmailTemplateType.STREAK_ALERT:
        return StreakAlertDataDto;
      case EmailTemplateType.PORTFOLIO_CONTACT:
        return PortfolioContactDataDto;
      case EmailTemplateType.PORTFOLIO_ACKNOWLEDGE:
        return PortfolioAcknowledgeDataDto;
      case EmailTemplateType.JOURNAL_UPDATE:
        return JournalUpdateDataDto;
      default:
        return Object;
    }
  })
  data?:
    | StreakAlertDataDto
    | PortfolioContactDataDto
    | PortfolioAcknowledgeDataDto
    | JournalUpdateDataDto
    | Record<string, any>;
}
