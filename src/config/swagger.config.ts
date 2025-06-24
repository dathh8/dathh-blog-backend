import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Api list')
  .setDescription('The API description')
  .setVersion('1.0')
  .addTag('api')
  .build();
