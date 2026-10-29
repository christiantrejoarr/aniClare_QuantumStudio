import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { IdentityFacade, sessionUsername } from '../../../identity/public';

@Injectable()
export class AdminAccessGuard implements CanActivate {
  constructor(private readonly identity: IdentityFacade) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { adminUsername?: string }>();
    const header = request.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    if (!(await this.identity.sessionIsValid(token))) {
      throw new UnauthorizedException({
        code: 'ADMIN_UNAUTHORIZED',
        message: 'La sesión de administración no es válida.',
      });
    }
    request.adminUsername = sessionUsername(token) ?? '';
    return true;
  }
}
