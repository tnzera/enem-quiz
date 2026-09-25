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

export interface Daily {
    challengeId: string;
    date: string;
    year: number;
    index: number;
    language: string | null;
    question: PublicQuestion;
}

export interface AnswerResult {
    alreadyAnswered: boolean;
    correct: boolean;
    correctAlternative: string;
    choice: string;
    streak: number;
}

export async function getDaily(): Promise<Daily> {
    const res = await fetch('/api/daily');
    if (!res.ok) throw new Error('Falha ao carregar o desafio do dia.');
    return res.json();
}

export async function submitAnswer(body: {
    deviceToken: string;
    year: number;
    index: number;
    language: string | null;
    choice: string;
}): Promise<AnswerResult> {
    const res = await fetch('/api/daily/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Falha ao enviar a resposta.');
    return res.json();
}

export function getDeviceToken(): string {
    let token = localStorage.getItem('deviceToken');
    if (!token) {
        token =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : String(Date.now()) + Math.random().toString(16).slice(2);
        localStorage.setItem('deviceToken', token);
    }
    return token;
}
