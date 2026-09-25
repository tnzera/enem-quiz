import { Injectable } from '@nestjs/common';
import type { QuestionDetail, QuestionStub } from './enem-api.types';

@Injectable()
export class EnemApiService {
    private readonly base =
        process.env.ENEM_API_BASE ?? 'http://localhost:3000/v1';

    async getYears(): Promise<number[]> {
        const exams = await this.fetchJson<Array<{ year: number }>>('/exams');
        return exams.map((e) => e.year);
    }

    async getQuestionStubs(year: number): Promise<QuestionStub[]> {
        const exam = await this.fetchJson<{ questions: QuestionStub[] }>(
            `/exams/${year}`,
        );
        return exam.questions;
    }

    async getQuestion(
        year: number,
        index: number,
        language: string | null,
    ): Promise<QuestionDetail> {
        const query = language ? `?language=${encodeURIComponent(language)}` : '';
        return this.fetchJson<QuestionDetail>(
            `/exams/${year}/questions/${index}${query}`,
        );
    }

    private async fetchJson<T>(path: string): Promise<T> {
        const res = await fetch(this.base + path);
        if (!res.ok) {
            throw new Error(`enem-api respondeu ${res.status} em ${path}`);
        }
        return (await res.json()) as T;
    }
}
