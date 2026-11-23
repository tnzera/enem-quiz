import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from './answer.entity';
import { User } from '../users/user.entity';

export interface LeaderRow {
    userId: string;
    name: string;
    picture: string | null;
    score: number;
    correct: number;
    total: number;
    rank: number;
}

export interface DisciplineReport {
    discipline: string;
    total: number;
    correct: number;
    rate: number; // % de acerto, com uma casa decimal
}

export interface MonthlyPoint {
    month: string; // 'YYYY-MM'
    total: number;
    correct: number;
    rate: number; // % de acerto, com uma casa decimal
}

const POINTS = 100;

@Injectable()
export class AnswersService {
    constructor(
        @InjectRepository(Answer)
        private readonly repo: Repository<Answer>,
    ) {}

    /**
     * Grava a resposta — uma vez por questão. Se o usuário já respondeu essa
     * questão, não grava de novo (não pontua repetição).
     */
    async record(
        userId: string,
        questionId: string,
        correct: boolean,
        discipline: string | null,
    ): Promise<void> {
        const exists = await this.repo.findOne({
            where: { userId, questionId },
        });
        if (exists) return;
        await this.repo.save(
            this.repo.create({ userId, questionId, correct, discipline }),
        );
    }

    /** Taxa de acerto do usuário por matéria. */
    async getReportByDiscipline(userId: string): Promise<DisciplineReport[]> {
        const rows = await this.repo
            .createQueryBuilder('a')
            .select('a.discipline', 'discipline')
            .addSelect('COUNT(*)', 'total')
            .addSelect('SUM(CASE WHEN a.correct THEN 1 ELSE 0 END)', 'correct')
            .where('a.user_id = :userId', { userId })
            .andWhere('a.discipline IS NOT NULL')
            .groupBy('a.discipline')
            .orderBy('a.discipline', 'ASC')
            .getRawMany();

        return rows.map((r) => {
            const total = Number(r.total);
            const correct = Number(r.correct);
            return {
                discipline: r.discipline,
                total,
                correct,
                rate: total ? Math.round((correct / total) * 1000) / 10 : 0,
            };
        });
    }

    /** Taxa de acerto do usuário mês a mês (últimos 12 meses). */
    async getMonthlyEvolution(userId: string): Promise<MonthlyPoint[]> {
        const monthExpr = "to_char(date_trunc('month', a.created_at), 'YYYY-MM')";
        const rows = await this.repo
            .createQueryBuilder('a')
            .select(monthExpr, 'month')
            .addSelect('COUNT(*)', 'total')
            .addSelect('SUM(CASE WHEN a.correct THEN 1 ELSE 0 END)', 'correct')
            .where('a.user_id = :userId', { userId })
            .andWhere(
                "a.created_at >= date_trunc('month', now()) - interval '11 months'",
            )
            .groupBy(monthExpr)
            .orderBy('month', 'ASC')
            .getRawMany();

        return rows.map((r) => {
            const total = Number(r.total);
            const correct = Number(r.correct);
            return {
                month: r.month,
                total,
                correct,
                rate: total ? Math.round((correct / total) * 1000) / 10 : 0,
            };
        });
    }

    /** Ranking de todos os usuários, do maior para o menor score. */
    async getRanking(): Promise<LeaderRow[]> {
        const rows = await this.repo
            .createQueryBuilder('a')
            .innerJoin(User, 'u', 'u.id = a.user_id')
            .select('u.id', 'userId')
            .addSelect('u.name', 'name')
            .addSelect('u.picture', 'picture')
            .addSelect(
                `SUM(CASE WHEN a.correct THEN ${POINTS} ELSE -${POINTS} END)`,
                'score',
            )
            .addSelect('SUM(CASE WHEN a.correct THEN 1 ELSE 0 END)', 'correct')
            .addSelect('COUNT(*)', 'total')
            .groupBy('u.id')
            .orderBy('score', 'DESC')
            .addOrderBy('total', 'DESC')
            .getRawMany();

        return rows.map((r, i) => ({
            userId: r.userId,
            name: r.name,
            picture: r.picture,
            score: Number(r.score),
            correct: Number(r.correct),
            total: Number(r.total),
            rank: i + 1,
        }));
    }
}
