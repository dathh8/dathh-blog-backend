import { IsEmail, IsEmpty, IsNotEmpty } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty({message: 'name can\'t not emty'})
    name: string;

    @IsEmail({}, {message: 'invalid email'})
    email: string;

    @IsNotEmpty()
    password: string;
}
