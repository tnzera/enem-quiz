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
    ): Promise<void> {
        const exists = await this.repo.findOne({
            where: { userId, questionId },
        });
        if (exists) return;
        await this.repo.save(this.repo.create({ userId, questionId, correct }));
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
