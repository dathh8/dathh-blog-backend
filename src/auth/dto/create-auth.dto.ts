import { IsNotEmpty } from "class-validator"

export class CreateAuthDto {
    @IsNotEmpty()
    email: string

    @IsNotEmpty()
    password: string
}


export class CodeAuthDto {
    @IsNotEmpty()
    _id: string

    @IsNotEmpty()
    code: string
}

export class ChangePasswordAuthDto {
    @IsNotEmpty()
    code: string;

    @IsNotEmpty()
    password: string;

    @IsNotEmpty()
    confirmPassword: string;

    @IsNotEmpty()
    email: string;
}