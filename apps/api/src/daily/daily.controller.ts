import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { DailyService } from './daily.service';
import type { SubmitAnswerDto } from './dto/submit-answer.dto';
import type { Letter } from '../enem-api/enem-api.types';

@Controller('daily')
export class DailyController {
    constructor(private readonly dailyService: DailyService) {}

    /** Questão do dia, sem o gabarito. */
    @Get()
    getDaily() {
        return this.dailyService.getDailyChallenge();
    }

    /** Envia a resposta e recebe a correção. */
    @Post('answer')
    answer(@Body() body: SubmitAnswerDto) {
        if (!body?.deviceToken) {
            throw new BadRequestException('deviceToken é obrigatório.');
        }
        if (body.year == null || body.index == null || !body.choice) {
            throw new BadRequestException('year, index e choice são obrigatórios.');
        }
        return this.dailyService.submitAnswer({
            deviceToken: body.deviceToken,
            year: Number(body.year),
            index: Number(body.index),
            language: body.language ?? null,
            choice: body.choice.toUpperCase() as Letter,
        });
    }
}
