import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { IdentityFacade } from '../../../identity/public';
import { OpenSessionDto } from './open-session.dto';

@Controller('admin')
export class AdminSessionController {
  constructor(private readonly identity: IdentityFacade) {}

  @Post('session')
  async open(@Body() body: OpenSessionDto): Promise<{ token: string }> {
    const token = await this.identity.openSession(body.username, body.password);
    if (!token) {
      throw new UnauthorizedException({
        code: 'ADMIN_UNAUTHORIZED',
        message: 'Usuario o contraseña incorrectos.',
      });
    }
    return { token };
  }
}
