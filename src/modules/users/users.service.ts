import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.entity';
import { Repository } from 'typeorm';
import { hashPasswordHepler } from '../../helpers/util';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import { ChangePasswordAuthDto, CodeAuthDto } from '@/auth/dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Check is email already exist
   * @param email
   * @returns
   */
  isEmailExist = async (email: string) => {
    const user = await this.usersRepository.findOneBy({ email });
    return !!user;
  };

  async create(createUserDto: CreateUserDto) {
    if (await this.isEmailExist(createUserDto.email)) {
      throw new BadRequestException(
        `Email ${createUserDto.email} already existed`,
      );
    }
    createUserDto.password = await hashPasswordHepler(createUserDto.password);
    const codeId = uuidv4();
    createUserDto.code_expired = dayjs().add(5, 'minutes').toISOString();
    createUserDto.code_id = codeId;
    const createdUser = await this.usersRepository.save(this.usersRepository.create(createUserDto));

    //send email
    this.mailerService
      .sendMail({
        to: createUserDto.email, // list of receivers
        subject: 'Active account', // Subject line
        template: 'register',
        context: {
          userName: createUserDto.name,
          code_id: codeId,
        },
      })
      .then(() => {
        console.log('send success');
      })
      .catch(() => {
        console.log('send fail');
      });

    return {
      id: createdUser.id,
    };
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if (filter.current) delete filter.current;
    if (filter.pageSize) delete filter.pageSize;
    if (!current) {
      current = 1;
    }
    if (!pageSize) {
      pageSize = 10;
    }

    const skip = (current - 1) * pageSize;

    const [results, totalItems] = await this.usersRepository.findAndCount({
      where: filter,
      order: sort,
      skip,
      take: pageSize,
      select: {
        // Exclude password field
        password: false,
      },
    });

    return { results, totalItems };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.usersRepository.findOneBy({ email });
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.usersRepository.update(
      { id: updateUserDto.id },
      { ...updateUserDto },
    );
  }

  async remove(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }

    return this.usersRepository.delete({ id: Number(id) });
  }

  async handleActive(codeAuthDto: CodeAuthDto) {
    const user = await this.usersRepository.findOneBy({
      id: codeAuthDto.id,
      code_id: codeAuthDto.code,
    });
    if (!user) {
      throw new BadRequestException('code invalid');
    }
    //check expire code
    const isBeforeCheck = dayjs().isBefore(dayjs(user.code_expired));
    if (isBeforeCheck) {
      await this.usersRepository.update(
        { id: codeAuthDto.id },
        {
          is_active: true,
        },
      );
    } else {
      throw new BadRequestException('code invalid');
    }

    return { isBeforeCheck: isBeforeCheck };
  }

  async retryActive(email: string) {
    const user = await this.usersRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestException('User not existed');
    }
    if (user.is_active) {
      throw new BadRequestException('User had been ative');
    }
    const codeId = uuidv4();
    await this.usersRepository.update(
      { id: user.id },
      {
        code_id: codeId,
        code_expired: dayjs().add(5, 'minutes').toISOString(),
      },
    );

    //send email
    // this.mailerService
    //   .sendMail({
    //     to: user.email, // list of receivers
    //     subject: 'Active accout', // Subject line
    //     template: "register",
    //     context: {
    //       userName: user.name,
    //       codeId: codeId
    //     }
    //   })
    //   .then(() => {
    //     console.log('send success');
    //   })
    //   .catch(() => {
    //     console.log('send fail');
    //   });

    return { id: user.id };
  }

  async retryPassword(email: string) {
    const user = await this.usersRepository.findOneBy({ email });
    if (!user) {
      throw new BadRequestException('User not existed');
    }

    const codeId = uuidv4();
    await this.usersRepository.update(
      { id: user.id },
      {
        code_id: codeId,
        code_expired: dayjs().add(5, 'minutes').toISOString(),
      },
    );

    //send email
    this.mailerService
      .sendMail({
        to: user.email, // list of receivers
        subject: 'Forgot password', // Subject line
        template: 'register',
        context: {
          userName: user.name,
          code_id: codeId,
        },
      })
      .then(() => {
        console.log('send success');
      })
      .catch(() => {
        console.log('send fail');
      });

    return { id: user.id, email: user.email };
  }

  async changePassword(data: ChangePasswordAuthDto) {
    if (data.password !== data.confirmPassword) {
      throw new BadRequestException('Invalid Input');
    }

    const user = await this.usersRepository.findOneBy({
      email: data.email,
      code_id: data.code,
    });
    if (!user) {
      throw new BadRequestException('Invalid User');
    }
    //check expire code
    const isBeforeCheck = dayjs().isBefore(dayjs(user.code_expired));
    if (isBeforeCheck) {
      const newPassword = await hashPasswordHepler(data.password);
      await this.usersRepository.update(
        { id: user.id },
        {
          password: newPassword,
        },
      );
    } else {
      throw new BadRequestException('code invalid');
    }

    return { result: true };
  }
}
