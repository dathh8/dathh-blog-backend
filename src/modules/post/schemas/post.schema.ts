import { EntitySchema } from 'typeorm';
import { Post } from './post.entity';

export const PostSchema = new EntitySchema<Post>({
  name: 'Post',
  target: Object,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    title: {
      type: String,
      nullable: false,
    },
    description: {
      type: String,
      nullable: false,
    },
    tags: {
      type: String,
      nullable: false,
    },
    content: {
      type: String,
      nullable: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    is_published: {
      type: Boolean,
      default: false,
    },
    author: {
      type: String,
      nullable: false,
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
    },
    updated_at: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {},
});
