import { BadRequestException, Injectable } from '@nestjs/common';
import { EnemApiService } from '../enem-api/enem-api.service';
import { AnswersRepository } from './answers.repository';
import { dateKey, seed } from '../common/date.util';
import { PublicQuestion, toPublicQuestion } from './question.model';
import type { Letter } from '../enem-api/enem-api.types';

export interface DailyChallenge {
    challengeId: string;
    date: string;
    year: number;
    index: number;
    language: string | null;
    question: PublicQuestion;
}

export interface SubmitAnswerInput {
    deviceToken: string;
    year: number;
    index: number;
    language: string | null;
    choice: Letter;
    date?: Date;
}

export interface SubmitAnswerResult {
    alreadyAnswered: boolean;
    correct: boolean;
    correctAlternative: Letter;
    choice: Letter;
    streak: number;
}

@Injectable()
export class DailyService {
    constructor(
        private readonly enemApi: EnemApiService,
        private readonly answers: AnswersRepository,
    ) {}

    /*
     Seleciona a questão do dia a partir da data:
     */
    async getDailyChallenge(date: Date = new Date()): Promise<DailyChallenge> {
        const key = dateKey(date);

        const years = await this.enemApi.getYears();
        const year = years[seed(key) % years.length];

        const stubs = await this.enemApi.getQuestionStubs(year);
        const stub = stubs[seed(`${key}:questao`) % stubs.length];

        const detail = await this.enemApi.getQuestion(
            year,
            stub.index,
            stub.language,
        );

        return {
            challengeId: key,
            date: key,
            year,
            index: stub.index,
            language: stub.language,
            question: toPublicQuestion(detail),
        };
    }

    /*
     * Valida a resposta e registra resultado do dia.
     */
    async submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerResult> {
        const date = input.date ?? new Date();
        const key = dateKey(date);

        const existing = this.answers.findForDay(input.deviceToken, key);
        if (existing) {
            return {
                alreadyAnswered: true,
                correct: existing.correct,
                correctAlternative: existing.correctAlternative,
                choice: existing.choice,
                streak: this.answers.currentStreak(input.deviceToken, date),
            };
        }

        const choice = input.choice.toUpperCase() as Letter;
        if (!['A', 'B', 'C', 'D', 'E'].includes(choice)) {
            throw new BadRequestException('Alternativa inválida (use A–E).');
        }

        const detail = await this.enemApi.getQuestion(
            input.year,
            input.index,
            input.language,
        );

        const correct = choice === detail.correctAlternative;
        this.answers.save(input.deviceToken, key, {
            choice,
            correct,
            correctAlternative: detail.correctAlternative,
        });

        return {
            alreadyAnswered: false,
            correct,
            correctAlternative: detail.correctAlternative,
            choice,
            streak: this.answers.currentStreak(input.deviceToken, date),
        };
    }
}
