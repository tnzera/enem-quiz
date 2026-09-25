/**
 * Utilitários de data 
 */

const TIME_ZONE = 'America/Sao_Paulo';

/** 'YYYY-MM-DD' no fuso S. Paulo. */
export function dateKey(date: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

export function seed(input: string): number {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return Math.abs(h | 0);
}
