import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Answer } from './answer.entity';
import { AnswersService } from './answers.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Answer])],
    controllers: [LeaderboardController],
    providers: [AnswersService],
    exports: [AnswersService],
})
export class AnswersModule {}
