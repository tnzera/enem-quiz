export interface PublicAlternative {
    letter: string;
    text: string | null;
    file: string | null;
}

export interface PublicQuestion {
    title: string;
    index: number;
    year: number;
    language: string | null;
    discipline: string | null;
    context: string | null;
    files: string[];
    alternativesIntroduction: string | null;
    alternatives: PublicAlternative[];
}

export interface RandomQuestion {
    id: string;
    year: number;
    index: number;
    language: string | null;
    question: PublicQuestion;
}

export interface AnswerResult {
    correct: boolean;
    correctAlternative: string;
}

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    picture: string | null;
}

// URL que inicia o login (passa pelo proxy do Vite).
export const LOGIN_URL = '/api/auth/google';

const TOKEN_KEY = 'token';

function getToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

function authHeader(): Record<string, string> {
    const t = getToken();
    return t ? { Authorization: `Bearer ${t}` } : {};
}

/**
 * Após o login, o backend redireciona com o token
 */
export function consumeTokenFromUrl(): void {
    const hash = window.location.hash;
    const match = hash.match(/token=([^&]+)/);
    if (match) {
        try {
            localStorage.setItem(TOKEN_KEY, decodeURIComponent(match[1]));
        } catch {
            /* ignore */
        }
        // limpa o #token da URL
        window.history.replaceState(null, '', window.location.pathname);
    }
}

/** Sorteia uma questão, evitando as já vistas. */
export async function getRandomQuestion(
    exclude: string[] = [],
): Promise<RandomQuestion> {
    const query = exclude.length
        ? `?exclude=${encodeURIComponent(exclude.join(','))}`
        : '';
    const res = await fetch(`/api/questions/random${query}`);
    if (!res.ok) throw new Error('Falha ao carregar a questão.');
    return res.json();
}

/** Envia a resposta e recebe a correção. O token (se houver) faz pontuar. */
export async function checkAnswer(body: {
    year: number;
    index: number;
    language: string | null;
    choice: string;
}): Promise<AnswerResult> {
    const res = await fetch('/api/questions/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Falha ao enviar a resposta.');
    return res.json();
}

export interface LeaderRow {
    userId: string;
    name: string;
    picture: string | null;
    score: number;
    correct: number;
    total: number;
    rank: number;
}

export interface LeaderboardData {
    top: LeaderRow[];
    me: LeaderRow | null;
}

export interface DisciplineReport {
    discipline: string;
    total: number;
    correct: number;
    rate: number;
}

/** Desempenho do usuário logado por matéria (null se não estiver logado). */
export interface MonthlyPoint {
    month: string; // 'YYYY-MM'
    total: number;
    correct: number;
    rate: number;
}

export interface MyReport {
    disciplines: DisciplineReport[];
    monthly: MonthlyPoint[];
}

export async function getMyReport(): Promise<MyReport | null> {
    if (!getToken()) return null;
    const res = await fetch('/api/reports/me', { headers: authHeader() });
    if (!res.ok) return null;
    const data = await res.json();
    return data as MyReport;
}

/** Ranking: top 10 + a posição do usuário logado. */
export async function getLeaderboard(): Promise<LeaderboardData> {
    const res = await fetch('/api/leaderboard', { headers: authHeader() });
    if (!res.ok) throw new Error('Falha ao carregar o ranking.');
    return res.json();
}

/** Retorna o usuário logado, ou null. */
export async function getMe(): Promise<AuthUser | null> {
    if (!getToken()) return null;
    const res = await fetch('/api/auth/me', { headers: authHeader() });
    if (!res.ok) return null;
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    return data && data.id ? (data as AuthUser) : null;
}

/** Encerra a sessão (descarta o token no cliente). */
export async function logout(): Promise<void> {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch {
        /* ignore */
    }
}

// ---------------------------------------------------------------- Salas

export interface RoomPlayer {
    userId: string;
    name: string;
    picture: string | null;
    isHost: boolean;
    answered: number;
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

export interface RoomState {
    code: string;
    status: 'waiting' | 'playing' | 'finished';
    isHost: boolean;
    durationMinutes: number;
    questionCount: number;
    remainingMs: number | null;
    players: RoomPlayer[];
    me: { answered: number; correct: number; done: boolean };
    question: (PublicQuestion & { position: number }) | null;
    results: RoomResult[] | null;
}

/** Chamada autenticada às rotas de sala; repassa a mensagem de erro do backend. */
async function roomRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const res = await fetch(`/api/rooms${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        const msg = Array.isArray(data?.message) ? data.message[0] : data?.message;
        throw new Error(msg ?? 'Erro na sala.');
    }
    return data as T;
}

export const createRoom = (durationMinutes: number, questionCount: number) =>
    roomRequest<{ code: string }>('', 'POST', { durationMinutes, questionCount });

export const joinRoom = (code: string) =>
    roomRequest<{ code: string }>(`/${encodeURIComponent(code)}/join`, 'POST');

export const startRoom = (code: string) =>
    roomRequest<{ ok: boolean }>(`/${encodeURIComponent(code)}/start`, 'POST');

export const getRoom = (code: string) =>
    roomRequest<RoomState>(`/${encodeURIComponent(code)}`);

export const answerRoom = (code: string, choice: string) =>
    roomRequest<AnswerResult & { done: boolean }>(
        `/${encodeURIComponent(code)}/answer`,
        'POST',
        { choice },
    );
