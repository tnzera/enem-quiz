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

/* Remove o gabarito */
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
