import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsMongoId, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserDto {
    @IsMongoId({message: "Invalid id"})
    @IsNotEmpty()
    _id: string;

    @IsOptional()
    name: string;

    codeId: string;
    isActive: boolean;
}
