import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.validateUser(dto.email, dto.password);
    const tokens = await this.auth.login(user.id);

    // refresh en cookie HTTP-only Secure
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  @UseGuards(RefreshGuard)
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldRefresh = req.cookies?.['refreshToken'];
    const tokens = await this.auth.refresh(req.user!['userId'], oldRefresh);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/auth/refresh',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.user!['userId']);
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
  }

  /** simple ping pour tester le guard */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    return { userId: req.user!['userId'] };
  }
}
