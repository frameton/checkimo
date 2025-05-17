import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

/** Récupère le cookie HTTP-only « refreshToken » */
const cookieExtractor = (req: Request): string | null =>
  req?.cookies?.refreshToken ?? null;

interface RefreshPayload {
  sub: string; // id utilisateur
  iat: number;
  exp: number;
}

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  /** Retourne l’identité + le jeton brut pour vérif. DB */
  validate(req: Request, payload: RefreshPayload) {
    const token = cookieExtractor(req);
    if (!token) throw new UnauthorizedException();
    return { userId: payload.sub, refreshToken: token };
  }
}
