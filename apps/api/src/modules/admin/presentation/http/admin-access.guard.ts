import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_ACCESS_TOKEN') ?? '';
    const header = context.switchToHttp().getRequest<Request>().header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    if (!expected || !token || !sameSecret(token, expected)) {
      throw new UnauthorizedException({
        code: 'ADMIN_UNAUTHORIZED',
        message: 'La clave de administración no es válida.',
      });
    }
    return true;
  }
}

function sameSecret(left: string, right: string): boolean {
  const actual = createHash('sha256').update(left).digest();
  const stored = createHash('sha256').update(right).digest();
  return timingSafeEqual(actual, stored);
}
