import { Module } from '@nestjs/common';
import { EnemApiModule } from '../enem-api/enem-api.module';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
    imports: [EnemApiModule],
    controllers: [QuestionsController],
    providers: [QuestionsService],
})
export class QuestionsModule {}
