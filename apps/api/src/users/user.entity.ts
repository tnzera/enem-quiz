import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    googleId: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    picture: string | null;

    @CreateDateColumn()
    createdAt: Date;
}
