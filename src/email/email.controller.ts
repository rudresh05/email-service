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
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import {
  JournalUpdateDataDto,
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
      'Zero-Fallback email dispatch. Strictly validates payloads against input contracts and returns typed output contracts.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email successfully accepted and delivered via SMTP',
    type: SendEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Input Contract Violation / Validation Failures',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized: Missing or invalid API secret key',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'SMTP delivery failure / Server error',
    type: ErrorResponseDto,
  })
  async sendEmail(
    @Body() sendEmailDto: SendEmailDto,
  ): Promise<SendEmailResponseDto> {
    return this.emailService.sendEmail(sendEmailDto);
  }
}
