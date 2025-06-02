import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { hashPasswordHepler } from '@/helpers/util';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import { ChangePasswordAuthDto, CodeAuthDto } from '@/auth/dto/create-auth.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly mailerService: MailerService
  ) {
  }

  /**
   * Check is email already exist
   * @param email
   * @returns 
   */
  isEmailExist = async (email: string) => {
    const user = await this.userModel.exists({ email });
    return !!user;
  }

  async create(createUserDto: CreateUserDto) {
    if (await this.isEmailExist(createUserDto.email)) {
      throw new BadRequestException(`Email ${createUserDto.email} already existed`);
    }
    const hashPassword = await hashPasswordHepler(createUserDto.password);
    createUserDto.password = hashPassword;
    let codeId = uuidv4();
    createUserDto.codeExpired = dayjs().add(5, 'minutes').toISOString();
    createUserDto.codeId = codeId;
    const createdUser = new this.userModel(createUserDto);
    createdUser.save();

    //send email
    this.mailerService
      .sendMail({
        to: createUserDto.email, // list of receivers
        subject: 'Active accout', // Subject line
        template: "register",
        context: {
          userName: createUserDto.name,
          codeId: codeId
        }
      })
      .then(() => {
        console.log('send success');
      })
      .catch(() => {
        console.log('send fail');
      });

    return {
      _id: createdUser._id
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
    const totalItems = ((await this.userModel.find(filter)).length);
    const totalPages = Math.ceil(totalItems / pageSize);
    const skip = (current - 1) * pageSize;

    const results = await this.userModel
      .find(filter)
      .limit(pageSize)
      .skip(skip)
      .select("-password")
      .sort(sort as any);
    return { results, totalItems };
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email })
  }

  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto._id }, { ...updateUserDto }
    );
  }

  async remove(id: string) {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException('Invalid ID');
    }

    return this.userModel.deleteOne({ _id: id });
  }

  async handleActive(codeAuthDto: CodeAuthDto) {
    const user = await this.userModel.findOne({
      _id: codeAuthDto._id,
      codeId: codeAuthDto.code
    })
    if (!user) {
      throw new BadRequestException('code invalid');
    }
    //check expire code
    const isBeforeCheck = dayjs().isBefore(dayjs(user.codeExpired));
    if (isBeforeCheck) {
      await this.userModel.updateOne({ _id: codeAuthDto._id }, {
        isActive: true
      })
    } else {
      throw new BadRequestException('code invalid');
    }


    return { isBeforeCheck: isBeforeCheck };
  }

  async retryActive(email: string) {
    const user = await this.userModel.findOne({ email});
    if (!user) {
      throw new BadRequestException("User not existed");
    }
    if (user.isActive) {
      throw new BadRequestException("User had been ative");
    }
    const codeId = uuidv4();
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes').toISOString()
    })

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

    return { _id: user._id };
  }

  async retryPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException("User not existed");
    }

    const codeId = uuidv4();
    await user.updateOne({
      codeId: codeId,
      codeExpired: dayjs().add(5, 'minutes').toISOString()
    })

     //send email
    this.mailerService
      .sendMail({
        to: user.email, // list of receivers
        subject: 'Forgot password', // Subject line
        template: "register",
        context: {
          userName: user.name,
          codeId: codeId
        }
      })
      .then(() => {
        console.log('send success');
      })
      .catch(() => {
        console.log('send fail');
      });


    return { _id: user._id, email: user.email };
  }

  async changePassword(data: ChangePasswordAuthDto) {
    if(data.password !== data.confirmPassword) {
      throw new BadRequestException("Invalid Input");
    }

     const user = await this.userModel.findOne({email: data.email,  codeId: data.code})
    if (!user) {
      throw new BadRequestException('Invalid User');
    }
    //check expire code
    const isBeforeCheck = dayjs().isBefore(dayjs(user.codeExpired));
    if (isBeforeCheck) {
      const newPassword = await hashPasswordHepler(data.password);
      await user.updateOne({
      password: newPassword
    })

    } else {
      throw new BadRequestException('code invalid');
    }

    return {result: true}
  }
}
