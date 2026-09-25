/** Tipos que descrevem as respostas da enem-api. */

export type Letter = 'A' | 'B' | 'C' | 'D' | 'E';

export interface Alternative {
    letter: Letter;
    text: string | null;
    file: string | null;
    isCorrect: boolean;
}

export interface QuestionDetail {
    title: string;
    index: number;
    year: number;
    language: string | null;
    discipline: string | null;
    context: string | null;
    files: string[];
    correctAlternative: Letter;
    alternativesIntroduction: string | null;
    alternatives: Alternative[];
}

export interface QuestionStub {
    title: string;
    index: number;
    discipline: string | null;
    language: string | null;
}
