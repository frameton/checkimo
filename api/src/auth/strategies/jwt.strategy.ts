import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

interface Payload {
  sub: string; // id utilisateur
  role: Role;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET', { infer: true }),
      //   TypeScript sait que c'est une string non-undefined
    });
  }

  async validate(payload: Payload) {
    return { userId: payload.sub, role: payload.role };   // va dans request.user
  }
}