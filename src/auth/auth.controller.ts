import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { JwtAuthGuard } from './passport/jwt-auth.guard';
import { Public, ResponseMessage } from '@/decorator/decorator';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { ChangePasswordAuthDto, CodeAuthDto } from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService
  ) {}

  @Post("login")
  @Public()
  @UseGuards(LocalAuthGuard)
  @ResponseMessage("Login")
  handleLogin(@Request() request) {
    return this.authService.login(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('register')
  @Public()
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('check-code')
  @Public()
  checkCode(@Body() codeAuthDto: CodeAuthDto) {
    return this.authService.checkCode(codeAuthDto);
  }

  @Post('retry-active')
  @Public()
  retryActive(@Body("email") email: string) {
    return this.authService.retryActive(email);
  }

  @Post('retry-password')
  @Public()
  retryPassword(@Body("email") email: string) {
    return this.authService.retryPassword(email);
  }

  @Post('change-password')
  @Public()
  changePassword(@Body() changePasswordAuthDto: ChangePasswordAuthDto) {
    return this.authService.changePassword(changePasswordAuthDto);
  }


  @Get('testMail')
  @Public()
  test() {
    this.mailerService
      .sendMail({
        to: 'dathh@smartosc.com', // list of receivers
        subject: 'Testing Nest MailerModule ✔', // Subject line
        text: 'welcome', // plaintext body
        template: "register",
        context: {
          userName: 'test',
          code_id: '123'
        }
      })
      .then(() => {
        console.log('send success');
      })
      .catch(() => {
        console.log('send fail');
      });

      return 'OK';
  }
}
