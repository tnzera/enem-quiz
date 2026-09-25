/**
 * DTO da submissão de resposta. Validação simples
 */
export interface SubmitAnswerDto {
    deviceToken: string;
    year: number;
    index: number;
    language: string | null;
    choice: string;
}
