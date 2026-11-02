/** Corpo do POST /questions/answer. */
export interface CheckAnswerDto {
    year: number;
    index: number;
    language: string | null;
    choice: string;
}
