// src/auth/roles.guard.ts
import {
  CanActivate, ExecutionContext, Injectable, ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;          // pas de restriction

    const { user } = ctx.switchToHttp().getRequest();
    console.log(required);
    
    console.log(user);
                 // payload injecté par JwtAuthGuard
    if (required.includes(user.role)) return true;

    throw new ForbiddenException('Forbidden resource');
  }
}