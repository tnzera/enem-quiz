import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { EnemApiService } from '../enem-api/enem-api.service';
import { UsersService } from '../users/users.service';
import { PublicQuestion, toPublicQuestion } from '../questions/question.model';
import type { Letter, QuestionStub } from '../enem-api/enem-api.types';

const MAX_PLAYERS = 10;
const LETTERS: Letter[] = ['A', 'B', 'C', 'D', 'E'];
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O, 1/I
const CODE_LENGTH = 6;
const ROOM_TTL_MS = 3 * 60 * 60 * 1000; // salas somem após 3 h
const MAX_YEARS_PER_ROOM = 5; // limita chamadas à enem-api ao montar a sala

type RoomStatus = 'waiting' | 'playing' | 'finished';

interface RoomQuestion {
    year: number;
    index: number;
    language: string | null;
}

interface Player {
    userId: string;
    name: string;
    picture: string | null;
    answers: { choice: Letter; correct: boolean }[];
    lastAnswerAt: number | null;
}

interface Room {
    code: string;
    hostId: string;
    status: RoomStatus;
    durationMinutes: number;
    questionCount: number;
    questions: RoomQuestion[];
    players: Map<string, Player>;
    createdAt: number;
    endsAt: number | null;
}

export interface RoomResult {
    userId: string;
    name: string;
    picture: string | null;
    correct: number;
    wrong: number;
    unanswered: number;
    winner: boolean;
}

export interface RoomView {
    code: string;
    status: RoomStatus;
    isHost: boolean;
    durationMinutes: number;
    questionCount: number;
    remainingMs: number | null;
    players: {
        userId: string;
        name: string;
        picture: string | null;
        isHost: boolean;
        answered: number;
    }[];
    me: { answered: number; correct: number; done: boolean };
    question: (PublicQuestion & { position: number }) | null;
    results: RoomResult[] | null;
}

/**
 * Salas de jogo em memória (são temporárias; somem se o backend reiniciar).
 */
@Injectable()
export class RoomsService {
    private readonly rooms = new Map<string, Room>();

    constructor(
        private readonly enemApi: EnemApiService,
        private readonly users: UsersService,
    ) {}

    async create(
        userId: string,
        durationMinutes: number,
        questionCount: number,
    ): Promise<{ code: string }> {
        if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 30) {
            throw new BadRequestException('O tempo deve ser de 1 a 30 minutos.');
        }
        if (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 20) {
            throw new BadRequestException('O número de questões deve ser de 1 a 20.');
        }
        this.cleanup();

        const host = await this.loadPlayer(userId);
        const questions = await this.pickQuestions(questionCount);

        const code = this.newCode();
        this.rooms.set(code, {
            code,
            hostId: userId,
            status: 'waiting',
            durationMinutes,
            questionCount: questions.length,
            questions,
            players: new Map([[userId, host]]),
            createdAt: Date.now(),
            endsAt: null,
        });
        return { code };
    }

    async join(code: string, userId: string): Promise<{ code: string }> {
        const room = this.get(code);
        if (room.players.has(userId)) return { code }; // reentrada
        if (room.status !== 'waiting') {
            throw new ConflictException('A partida já começou.');
        }
        if (room.players.size >= MAX_PLAYERS) {
            throw new ConflictException(`Sala cheia (máximo ${MAX_PLAYERS}).`);
        }
        room.players.set(userId, await this.loadPlayer(userId));
        return { code };
    }

    start(code: string, userId: string): { ok: boolean } {
        const room = this.get(code);
        if (room.hostId !== userId) {
            throw new ForbiddenException('Só o criador da sala pode iniciar.');
        }
        if (room.status !== 'waiting') {
            throw new ConflictException('A partida já foi iniciada.');
        }
        room.status = 'playing';
        room.endsAt = Date.now() + room.durationMinutes * 60_000;
        // Adianta o download da 1ª questão (fica no cache para todos).
        const q = room.questions[0];
        void this.enemApi.getQuestion(q.year, q.index, q.language).catch(() => undefined);
        return { ok: true };
    }

    async view(code: string, userId: string): Promise<RoomView> {
        const room = this.get(code);
        const me = this.participant(room, userId);
        this.refresh(room);

        const answered = me.answers.length;
        const done = answered >= room.questionCount;

        let question: RoomView['question'] = null;
        if (room.status === 'playing' && !done) {
            const q = room.questions[answered];
            const detail = await this.enemApi.getQuestion(q.year, q.index, q.language);
            question = { ...toPublicQuestion(detail), position: answered + 1 };
        }

        return {
            code: room.code,
            status: room.status,
            isHost: room.hostId === userId,
            durationMinutes: room.durationMinutes,
            questionCount: room.questionCount,
            remainingMs:
                room.status === 'playing' && room.endsAt
                    ? Math.max(0, room.endsAt - Date.now())
                    : null,
            players: [...room.players.values()].map((p) => ({
                userId: p.userId,
                name: p.name,
                picture: p.picture,
                isHost: p.userId === room.hostId,
                answered: p.answers.length,
            })),
            me: {
                answered,
                correct: me.answers.filter((a) => a.correct).length,
                done,
            },
            question,
            results: room.status === 'finished' ? this.results(room) : null,
        };
    }

    async answer(
        code: string,
        userId: string,
        choiceRaw: string,
    ): Promise<{ correct: boolean; correctAlternative: Letter; done: boolean }> {
        const room = this.get(code);
        const me = this.participant(room, userId);
        this.refresh(room);
        if (room.status !== 'playing') {
            throw new ConflictException('A partida não está em andamento.');
        }

        const position = me.answers.length;
        if (position >= room.questionCount) {
            throw new ConflictException('Você já respondeu todas as questões.');
        }
        const choice = (choiceRaw ?? '').toUpperCase() as Letter;
        if (!LETTERS.includes(choice)) {
            throw new BadRequestException('Alternativa inválida (use A–E).');
        }

        const q = room.questions[position];
        const detail = await this.enemApi.getQuestion(q.year, q.index, q.language);
        const correct = choice === detail.correctAlternative;

        me.answers.push({ choice, correct });
        me.lastAnswerAt = Date.now();
        this.refresh(room); // termina se todos já responderam tudo

        return {
            correct,
            correctAlternative: detail.correctAlternative,
            done: me.answers.length >= room.questionCount,
        };
    }

    // ---------------------------------------------------------------------

    /** Encerra a partida quando o tempo acaba ou todos terminam. */
    private refresh(room: Room): void {
        if (room.status !== 'playing') return;
        const timeUp = room.endsAt !== null && Date.now() >= room.endsAt;
        const allDone = [...room.players.values()].every(
            (p) => p.answers.length >= room.questionCount,
        );
        if (timeUp || allDone) room.status = 'finished';
    }

    /** Placar: mais acertos; desempate por menos erros e por quem terminou antes. */
    private results(room: Room): RoomResult[] {
        const rows = [...room.players.values()]
            .map((p) => {
                const correct = p.answers.filter((a) => a.correct).length;
                return {
                    userId: p.userId,
                    name: p.name,
                    picture: p.picture,
                    correct,
                    wrong: p.answers.length - correct,
                    unanswered: room.questionCount - p.answers.length,
                    lastAnswerAt: p.lastAnswerAt ?? Number.MAX_SAFE_INTEGER,
                };
            })
            .sort(
                (a, b) =>
                    b.correct - a.correct ||
                    a.wrong - b.wrong ||
                    a.lastAnswerAt - b.lastAnswerAt,
            );

        const best = rows[0];
        return rows.map(({ lastAnswerAt: _ignored, ...r }) => ({
            ...r,
            // Empate exato em acertos e erros = vencedores juntos. Sem acertos, sem vencedor.
            winner:
                best.correct > 0 &&
                r.correct === best.correct &&
                r.wrong === best.wrong,
        }));
    }

    /** Sorteia questões distintas, usando poucos anos para economizar chamadas. */
    private async pickQuestions(count: number): Promise<RoomQuestion[]> {
        const years = shuffle(await this.enemApi.getYears()).slice(
            0,
            Math.min(MAX_YEARS_PER_ROOM, count),
        );
        const pool: RoomQuestion[] = [];
        const seen = new Set<string>();
        for (const year of years) {
            const stubs: QuestionStub[] = await this.enemApi.getQuestionStubs(year);
            for (const s of shuffle(stubs)) {
                const key = `${year}-${s.index}`; // uma variante de idioma por questão
                if (seen.has(key)) continue;
                seen.add(key);
                pool.push({ year, index: s.index, language: s.language });
            }
        }
        return shuffle(pool).slice(0, count);
    }

    private async loadPlayer(userId: string): Promise<Player> {
        const user = await this.users.findById(userId);
        if (!user) throw new UnauthorizedException('Usuário não encontrado.');
        return {
            userId,
            name: user.name || user.email,
            picture: user.picture,
            answers: [],
            lastAnswerAt: null,
        };
    }

    private get(code: string): Room {
        const room = this.rooms.get((code ?? '').toUpperCase());
        if (!room) throw new NotFoundException('Sala não encontrada. Confira o código.');
        return room;
    }

    private participant(room: Room, userId: string): Player {
        const p = room.players.get(userId);
        if (!p) throw new ForbiddenException('Você não está nesta sala.');
        return p;
    }

    private newCode(): string {
        let code: string;
        do {
            code = Array.from(
                { length: CODE_LENGTH },
                () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)],
            ).join('');
        } while (this.rooms.has(code));
        return code;
    }

    private cleanup(): void {
        const limit = Date.now() - ROOM_TTL_MS;
        for (const [code, room] of this.rooms) {
            if (room.createdAt < limit) this.rooms.delete(code);
        }
    }
}

function shuffle<T>(list: T[]): T[] {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
