import { Injectable } from '@nestjs/common';
import type { QuestionDetail, QuestionStub } from './enem-api.types';

/**
 * Acesso à enem-api com cache em memória. Os dados das provas não mudam,
 * então cada recurso é buscado uma única vez. Guardamos a Promise (e não o
 * resultado) para que pedidos simultâneos da mesma questão virem uma só
 * requisição — importante porque a enem-api limita 10 requisições/10 s por rota.
 */
@Injectable()
export class EnemApiService {
    private readonly base =
        process.env.ENEM_API_BASE ?? 'http://localhost:3000/v1';

    private readonly cache = new Map<string, Promise<unknown>>();

    async getYears(): Promise<number[]> {
        const exams = await this.cached<Array<{ year: number }>>('/exams');
        return exams.map((e) => e.year);
    }

    async getQuestionStubs(year: number): Promise<QuestionStub[]> {
        const exam = await this.cached<{ questions: QuestionStub[] }>(
            `/exams/${year}`,
        );
        return exam.questions;
    }

    getQuestion(
        year: number,
        index: number,
        language: string | null,
    ): Promise<QuestionDetail> {
        const query = language ? `?language=${encodeURIComponent(language)}` : '';
        return this.cached<QuestionDetail>(
            `/exams/${year}/questions/${index}${query}`,
        );
    }

    private cached<T>(path: string): Promise<T> {
        let entry = this.cache.get(path) as Promise<T> | undefined;
        if (!entry) {
            entry = this.fetchJson<T>(path).catch((err) => {
                this.cache.delete(path); // não guarda falhas (ex.: 429)
                throw err;
            });
            this.cache.set(path, entry);
        }
        return entry;
    }

    private async fetchJson<T>(path: string): Promise<T> {
        const res = await fetch(this.base + path);
        if (!res.ok) {
            throw new Error(`enem-api respondeu ${res.status} em ${path}`);
        }
        return (await res.json()) as T;
    }
}
