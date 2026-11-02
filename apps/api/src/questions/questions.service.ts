import { BadRequestException, Injectable } from '@nestjs/common';
import { EnemApiService } from '../enem-api/enem-api.service';
import {
    PublicQuestion,
    RandomQuestion,
    questionId,
    toPublicQuestion,
} from './question.model';
import type { Letter } from '../enem-api/enem-api.types';

const LETTERS: Letter[] = ['A', 'B', 'C', 'D', 'E'];
const MAX_ATTEMPTS = 8;

export interface CheckAnswerInput {
    year: number;
    index: number;
    language: string | null;
    choice: Letter;
}

export interface CheckAnswerResult {
    correct: boolean;
    correctAlternative: Letter;
}

@Injectable()
export class QuestionsService {
    constructor(private readonly enemApi: EnemApiService) {}

    /**
     * Sorteia uma questão aleatória
     */
    async getRandomQuestion(exclude: string[] = []): Promise<RandomQuestion> {
        const years = await this.enemApi.getYears();
        const excluded = new Set(exclude);

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const year = years[Math.floor(Math.random() * years.length)];
            const stubs = await this.enemApi.getQuestionStubs(year);

            const candidates = stubs.filter(
                (s) => !excluded.has(questionId(year, s.index, s.language)),
            );
            if (candidates.length === 0) continue; // ano todo já visto, tenta outro

            const stub = candidates[Math.floor(Math.random() * candidates.length)];
            return this.buildRandom(year, stub.index, stub.language);
        }

        // Fallback: sorteia sem respeitar o exclude.
        const year = years[Math.floor(Math.random() * years.length)];
        const stubs = await this.enemApi.getQuestionStubs(year);
        const stub = stubs[Math.floor(Math.random() * stubs.length)];
        return this.buildRandom(year, stub.index, stub.language);
    }

    /** Valida a resposta . */
    async checkAnswer(input: CheckAnswerInput): Promise<CheckAnswerResult> {
        const choice = input.choice.toUpperCase() as Letter;
        if (!LETTERS.includes(choice)) {
            throw new BadRequestException('Alternativa inválida (use A–E).');
        }

        const detail = await this.enemApi.getQuestion(
            input.year,
            input.index,
            input.language,
        );

        return {
            correct: choice === detail.correctAlternative,
            correctAlternative: detail.correctAlternative,
        };
    }

    private async buildRandom(
        year: number,
        index: number,
        language: string | null,
    ): Promise<RandomQuestion> {
        const detail = await this.enemApi.getQuestion(year, index, language);
        const question: PublicQuestion = toPublicQuestion(detail);
        return {
            id: questionId(year, index, language),
            year,
            index,
            language,
            question,
        };
    }
}
