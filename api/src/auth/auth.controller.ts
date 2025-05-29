import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { AuthPayloadDto } from './dto/auth-payload.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly userService: UsersService
  ) {}

  /**
   * POST /auth/login
   * Retourne AuthPayload { accessToken } enveloppé par ApiSuccessInterceptor
   */
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthPayloadDto> {
    const user = await this.auth.validateUser(dto.email, dto.password);
    const { accessToken, refreshToken } = await this.auth.login({
      id: user.id,
      role: user.role,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return { accessToken };
  }

  /**
   * POST /auth/refresh
   * Renouvellement de l'access token, protégé par RefreshGuard
   */
  @Post('refresh')
  @UseGuards(RefreshGuard)
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthPayloadDto> {
    const oldRefresh = req.cookies['refreshToken'];
    const { accessToken, refreshToken } = await this.auth.refresh(
      req.user!['userId'],
      oldRefresh,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return { accessToken };
  }

  /**
   * POST /auth/logout
   * Invalidation du refresh token, protégé par JwtAuthGuard
   * Retourne null enveloppé par ApiSuccessInterceptor
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<null> {
    await this.auth.logout(req.user!['userId']);
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return null;
  }

  /**
   * GET /auth/me
   * Retourne l'identité de l'utilisateur courant
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async me(@Req() req: Request) {

    if (!req.user) throw new NotFoundException('User not found');
    const user = await this.userService.findOne(req.user['userId']);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
