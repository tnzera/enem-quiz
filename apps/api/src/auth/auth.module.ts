import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { GoogleStrategy } from './google.strategy';
import { AuthController } from './auth.controller';

// JwtModule é global (declarado no AppModule), então não precisa importar aqui.
@Module({
    imports: [UsersModule, PassportModule],
    controllers: [AuthController],
    providers: [GoogleStrategy],
})
export class AuthModule {}
