import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from './answer.entity';
import { AnswersService } from './answers.service';
import { LeaderboardController } from './leaderboard.controller';
import { ReportsController } from './reports.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Answer])],
    controllers: [LeaderboardController, ReportsController],
    providers: [AnswersService],
    exports: [AnswersService],
})
export class AnswersModule {}
