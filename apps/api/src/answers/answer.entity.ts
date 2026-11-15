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

    /** Matéria da questão (ex.: "matematica"), gravada para os relatórios. */
    @Column({ type: 'varchar', nullable: true })
    discipline: string | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
