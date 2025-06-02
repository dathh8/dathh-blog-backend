
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import dayjs from 'dayjs';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

   @Prop()
  codeId: string;

   @Prop()
  codeExpired: string;

  @Prop({default: false})
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
