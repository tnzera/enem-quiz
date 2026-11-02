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
