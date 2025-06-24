import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './schemas/post.entity';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async create(createPostDto: CreatePostDto): Promise<Post> {
    return await this.postRepository.save(
      this.postRepository.create(createPostDto),
    );
  }

  async findAll(pageSize = 50, currentPage = 1): Promise<Post[]> {
    const skip = (currentPage - 1) * pageSize;
    return this.postRepository.find({
      skip,
      take: pageSize,
    });
  }

  async getAll(options: {
    current: number;
    pageSize: number;
    filters?: Record<string, string>;
  }) {
    const { current, pageSize, filters } = options;
    const skip = (current - 1) * pageSize;

    const query = this.postRepository.createQueryBuilder('post')
      .skip(skip)
      .take(pageSize);

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query.andWhere(`post.${key} = :${key}`, { [key]: value });
        }
      });
    }

    const [results, total] = await query.getManyAndCount();
    return { results, total };
  }

  async findOne(id: number): Promise<Post | null> {
    return this.postRepository.findOneBy({ id });
  }

  async update(id: number, updatePostDto: UpdatePostDto): Promise<Post | null> {
    await this.postRepository.update(id, updatePostDto);
    return this.postRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.postRepository.delete(id);
  }
}
