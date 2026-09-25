import { Module } from '@nestjs/common';
import { EnemApiModule } from '../enem-api/enem-api.module';
import { DailyController } from './daily.controller';
import { DailyService } from './daily.service';
import { AnswersRepository } from './answers.repository';

@Module({
    imports: [EnemApiModule],
    controllers: [DailyController],
    providers: [DailyService, AnswersRepository],
})
export class DailyModule {}
