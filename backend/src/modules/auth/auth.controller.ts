import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('demo-accounts')
  getDemoAccounts() {
    return this.authService.getDemoAccounts();
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Get('invitation/validate')
  validateInvitation(@Query('token') token: string) {
    return this.authService.validateInvitation(token);
  }

  @Public()
  @Post('set-password')
  setPassword(@Body() dto: { token: string; newPassword: string }) {
    return this.authService.setPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.logout(user.userId, dto.refreshToken);
  }

  @Get('me')
  me(@CurrentUser() user: CurrentUserPayload) {
    return user;
  }

  @Post('change-password')
  changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { newPassword: string },
  ) {
    return this.authService.changePassword(user.userId, dto);
  }
}
