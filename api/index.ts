import { createServer, IncomingMessage, ServerResponse } from 'http';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

let cachedServer: any = null;

async function bootstrapServer() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule, { bodyParser: false });
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
}

export default async (req: IncomingMessage, res: ServerResponse) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://dathh-blog.vercel.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  const server = await bootstrapServer();
  server(req, res);
};