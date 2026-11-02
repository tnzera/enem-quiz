import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnswersService, LeaderRow } from './answers.service';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { UserId } from '../auth/user-id.decorator';

@Controller('leaderboard')
export class LeaderboardController {
    constructor(private readonly answers: AnswersService) {}

    /** Top 10 + a posição do usuário logado (se houver). */
    @Get()
    @UseGuards(OptionalAuthGuard)
    async get(
        @UserId() userId: string | null,
    ): Promise<{ top: LeaderRow[]; me: LeaderRow | null }> {
        const ranking = await this.answers.getRanking();
        const top = ranking.slice(0, 10);
        const me = userId
            ? (ranking.find((r) => r.userId === userId) ?? null)
            : null;
        return { top, me };
    }
}
