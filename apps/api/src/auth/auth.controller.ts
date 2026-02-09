import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';

class RegisterDto {
  email!: string;
  password!: string;
  name!: string;
}

class LoginDto {
  email!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto.email, dto.password, dto.name, req.ip);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto.email, dto.password, req.ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: Request) {
    return this.authService.getProfile((req.user as any).id);
  }
}
