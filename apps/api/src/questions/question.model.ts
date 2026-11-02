import type { Letter, QuestionDetail } from '../enem-api/enem-api.types';

export interface PublicAlternative {
    letter: Letter;
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

/** Resposta do GET /questions/random: a questão pública + seu identificador. */
export interface RandomQuestion {
    id: string; // "ano-index-idioma", ex.: "2017-155-" ou "2023-1-ingles"
    year: number;
    index: number;
    language: string | null;
    question: PublicQuestion;
}

/** Identificador único de uma questão (ano + número + idioma). */
export function questionId(
    year: number,
    index: number,
    language: string | null,
): string {
    return `${year}-${index}-${language ?? ''}`;
}

/** Remove o gabarito (correctAlternative e isCorrect) antes de enviar ao cliente. */
export function toPublicQuestion(q: QuestionDetail): PublicQuestion {
    return {
        title: q.title,
        index: q.index,
        year: q.year,
        language: q.language,
        discipline: q.discipline,
        context: q.context,
        files: q.files,
        alternativesIntroduction: q.alternativesIntroduction,
        alternatives: q.alternatives.map((a) => ({
            letter: a.letter,
            text: a.text,
            file: a.file,
        })),
    };
}
