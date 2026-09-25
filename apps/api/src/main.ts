import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors(); // libera o front (Vite) em dev

    const port = process.env.PORT ?? 3333;
    await app.listen(port);
    console.log(`ENEM Quiz API em http://localhost:${port}`);
}

bootstrap();
