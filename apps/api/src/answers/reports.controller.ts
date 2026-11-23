import {
    Controller,
    Get,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import {
    AnswersService,
    DisciplineReport,
    MonthlyPoint,
} from './answers.service';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { UserId } from '../auth/user-id.decorator';

@Controller('reports')
export class ReportsController {
    constructor(private readonly answers: AnswersService) {}

    /** Desempenho do usuário logado: por matéria e evolução mensal. */
    @Get('me')
    @UseGuards(OptionalAuthGuard)
    async me(
        @UserId() userId: string | null,
    ): Promise<{ disciplines: DisciplineReport[]; monthly: MonthlyPoint[] }> {
        if (!userId) {
            throw new UnauthorizedException('Faça login para ver seu relatório.');
        }
        const [disciplines, monthly] = await Promise.all([
            this.answers.getReportByDiscipline(userId),
            this.answers.getMonthlyEvolution(userId),
        ]);
        return { disciplines, monthly };
    }
}
