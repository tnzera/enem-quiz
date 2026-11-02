import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

/**
 * Registro de uma resposta de um usuário a uma questão.
 * Única por (usuário, questão) — cada questão pontua só uma vez.
 */
@Entity('answers')
@Unique(['userId', 'questionId'])
export class Answer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'question_id' })
    questionId: string;

    @Column()
    correct: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
