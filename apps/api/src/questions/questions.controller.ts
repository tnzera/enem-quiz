import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import type { CheckAnswerDto } from './dto/check-answer.dto';
import type { Letter } from '../enem-api/enem-api.types';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { UserId } from '../auth/user-id.decorator';

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) {}

    /** Sorteia uma questão. `exclude` = ids . */
    @Get('random')
    random(@Query('exclude') exclude?: string) {
        const list = exclude ? exclude.split(',').filter(Boolean) : [];
        return this.questionsService.getRandomQuestion(list);
    }

    /** Envia a resposta e recebe a correção. Pontua se houver usuário logado. */
    @Post('answer')
    @UseGuards(OptionalAuthGuard)
    answer(@Body() body: CheckAnswerDto, @UserId() userId: string | null) {
        if (body.year == null || body.index == null || !body.choice) {
            throw new BadRequestException('year, index e choice são obrigatórios.');
        }
        return this.questionsService.checkAnswer(
            {
                year: Number(body.year),
                index: Number(body.index),
                language: body.language ?? null,
                choice: body.choice.toUpperCase() as Letter,
            },
            userId,
        );
    }
}
