import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { TemplatesService } from './templates/templates.service';

@Module({
  imports: [ConfigModule],
  controllers: [EmailController],
  providers: [EmailService, TemplatesService],
  exports: [EmailService],
})
export class EmailModule {}
