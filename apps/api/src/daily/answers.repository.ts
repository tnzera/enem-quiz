import { Injectable } from '@nestjs/common';
import { dateKey } from '../common/date.util';
import type { Letter } from '../enem-api/enem-api.types';

export interface AnswerRecord {
    choice: Letter;
    correct: boolean;
    correctAlternative: Letter;
}

//Repositório de respostas

@Injectable()
export class AnswersRepository {
    private readonly byDevice = new Map<string, Map<string, AnswerRecord>>();

    findForDay(device: string, dayKey: string): AnswerRecord | undefined {
        return this.byDevice.get(device)?.get(dayKey);
    }

    save(device: string, dayKey: string, record: AnswerRecord): void {
        if (!this.byDevice.has(device)) {
            this.byDevice.set(device, new Map());
        }
        this.byDevice.get(device)!.set(dayKey, record);
    }

    /** dias consecutivos respondidos terminando em `today`. */
    currentStreak(device: string, today: Date = new Date()): number {
        const days = this.byDevice.get(device);
        if (!days) return 0;

        let streak = 0;
        const cursor = new Date(today);
        while (days.has(dateKey(cursor))) {
            streak++;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }
        return streak;
    }
}
