import {
    Controller,
    Get,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { AnswersService, DisciplineReport } from './answers.service';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { UserId } from '../auth/user-id.decorator';

@Controller('reports')
export class ReportsController {
    constructor(private readonly answers: AnswersService) {}

    /** Desempenho do usuário logado, por matéria. */
    @Get('me')
    @UseGuards(OptionalAuthGuard)
    async me(
        @UserId() userId: string | null,
    ): Promise<{ disciplines: DisciplineReport[] }> {
        if (!userId) {
            throw new UnauthorizedException('Faça login para ver seu relatório.');
        }
        return {
            disciplines: await this.answers.getReportByDiscipline(userId),
        };
    }
}
