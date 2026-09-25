import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DailyModule } from './daily/daily.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DailyModule,
        // TypeOrmModule
    ],
})
export class AppModule {}
