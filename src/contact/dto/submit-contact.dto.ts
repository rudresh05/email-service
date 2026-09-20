import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitContactDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the visitor' })
  @IsString({ message: 'visitorName must be a string' })
  @IsNotEmpty({ message: 'Your name is required' })
  visitorName: string;

  @ApiProperty({ example: 'johndoe@example.com', description: 'Email address of the visitor' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Your email is required' })
  visitorEmail: string;

  @ApiPropertyOptional({ example: 'Portfolio Collaboration', description: 'Project origin or topic of the inquiry' })
  @IsOptional()
  @IsString({ message: 'project must be a string' })
  project?: string;

  @ApiProperty({ example: 'Hey Rudresh, loved your portfolio and want to discuss a software project.', description: 'Message content' })
  @IsString({ message: 'message must be a string' })
  @IsNotEmpty({ message: 'Message content cannot be empty' })
  message: string;

  @ApiPropertyOptional({ description: 'Hidden honeypot field to block automated bot submissions' })
  @IsOptional()
  @IsString()
  website_hp?: string;
}
