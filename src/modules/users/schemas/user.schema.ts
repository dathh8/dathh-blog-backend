import dayjs from 'dayjs';
import { EntitySchema } from 'typeorm';
import { User } from './user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    is_active: {
      type: Boolean,
      default: false,
    },
    code_expired: {
      type: String,
    },
    code_id: {
      type: String,
    },
    password: {
      type: String,
    },
  },
  relations: {},
});
