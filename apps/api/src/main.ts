import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
        credentials: true,
    });

    const port = process.env.PORT ?? 3333;
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`ENEM Quiz API em http://localhost:${port}`);
}

bootstrap();
