import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { comparePasswordHelper } from '@/helpers/util';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { ChangePasswordAuthDto, CodeAuthDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid User');
    }
    const isValidPassword = await comparePasswordHelper(pass, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid Password');
    }
    const payload = { sub: user.name, username: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const isValidPassword = await comparePasswordHelper(pass, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);
    const tokenDecode = this.jwtService.decode(token);
    return {
      access_token: token,
      expires_at: tokenDecode.exp,
      user: {
        email: user.email,
        _id: user.id,
        name: user.name,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async checkCode(codeAuthDto: CodeAuthDto) {
    return this.usersService.handleActive(codeAuthDto);
  }

  async retryActive(email: string) {
    return this.usersService.retryActive(email);
  }

  async retryPassword(email: string) {
    return this.usersService.retryPassword(email);
  }

  async changePassword(changePasswordAuthDto: ChangePasswordAuthDto) {
    return this.usersService.changePassword(changePasswordAuthDto);
  }

  // async validateUser(username: string, pass: string): Promise<any> {
  //   const user = await this.usersService.findOne(username);
  //   if (user && user.password === pass) {
  //     const { password, ...result } = user;
  //     return result;
  //   }
  //   return null;
  // }
}
