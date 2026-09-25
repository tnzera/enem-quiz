import { Module } from '@nestjs/common';
import { EnemApiService } from './enem-api.service';

@Module({
    providers: [EnemApiService],
    exports: [EnemApiService],
})
export class EnemApiModule {}
