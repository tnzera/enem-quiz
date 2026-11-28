import { Module } from '@nestjs/common';
import { EnemApiModule } from '../enem-api/enem-api.module';
import { UsersModule } from '../users/users.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
    imports: [EnemApiModule, UsersModule],
    controllers: [RoomsController],
    providers: [RoomsService],
})
export class RoomsModule {}
