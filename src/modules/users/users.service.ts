import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { hashPasswordHepler } from '@/helpers/util';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>
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
    const createdUser = new this.userModel(createUserDto);
    createdUser.save();
    return {
      _id: createdUser._id
    };
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);
    if(filter.current) delete filter.current;
    if(filter.pageSize) delete filter.pageSize;
    if(!current) {
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
    return {results, totalItems};
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async findByEmail (email: string) {
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

    return this.userModel.deleteOne({_id: id});
  }
}
