import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CurrentUserData } from '../../../common/src/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const publicKey = readFileSync(
      process.env.JWT_PUBLIC_KEY_PATH ?? join(process.cwd(), 'keys/public.pem'),
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: {
    sub: string;
    tenantId: string | null;
    role: string;
    allowedStoreIds: string[];
  }): Promise<CurrentUserData> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      sub: payload.sub,
      tenantId: payload.tenantId ?? null,
      role: payload.role,
      allowedStoreIds: payload.allowedStoreIds ?? [],
    };
  }
}
