import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
    Query,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import type { CheckAnswerDto } from './dto/check-answer.dto';
import type { Letter } from '../enem-api/enem-api.types';

@Controller('questions')
export class QuestionsController {
    constructor(private readonly questionsService: QuestionsService) {}

    /** Sorteia uma questão. `exclude` = ids . */
    @Get('random')
    random(@Query('exclude') exclude?: string) {
        const list = exclude ? exclude.split(',').filter(Boolean) : [];
        return this.questionsService.getRandomQuestion(list);
    }

    /** Envia a resposta e recebe a correção. */
    @Post('answer')
    answer(@Body() body: CheckAnswerDto) {
        if (body.year == null || body.index == null || !body.choice) {
            throw new BadRequestException('year, index e choice são obrigatórios.');
        }
        return this.questionsService.checkAnswer({
            year: Number(body.year),
            index: Number(body.index),
            language: body.language ?? null,
            choice: body.choice.toUpperCase() as Letter,
        });
    }
}
