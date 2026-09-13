import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const configuredKey = this.configService.get<string>('API_SECRET_KEY');

    // If no secret key is set in environment, block all requests for security
    if (!configuredKey) {
      throw new UnauthorizedException('API_SECRET_KEY is not configured on the server');
    }

    // Check Authorization Bearer header or x-api-key header
    const authHeader = request.headers['authorization'];
    const xApiKey = request.headers['x-api-key'];

    let providedKey = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.substring(7).trim();
    } else if (xApiKey) {
      providedKey = Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
    }

    if (!providedKey || providedKey !== configuredKey) {
      throw new UnauthorizedException('Invalid or missing API Key');
    }

    return true;
  }
}
