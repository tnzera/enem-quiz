import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export interface GoogleProfileData {
    googleId: string;
    email: string;
    name: string;
    picture: string | null;
}

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
    ) {}

    findById(id: string): Promise<User | null> {
        return this.repo.findOne({ where: { id } });
    }

    /** Busca o usuário pelo googleId; cria se não existir, atualiza se existir. */
    async findOrCreate(data: GoogleProfileData): Promise<User> {
        let user = await this.repo.findOne({ where: { googleId: data.googleId } });
        if (!user) {
            user = this.repo.create(data);
        } else {
            user.email = data.email;
            user.name = data.name;
            user.picture = data.picture;
        }
        return this.repo.save(user);
    }
}
