import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        config: ConfigService,
        private readonly users: UsersService,
    ) {
        super({
            clientID: config.get<string>('GOOGLE_CLIENT_ID')!,
            clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET')!,
            callbackURL: config.get<string>('GOOGLE_CALLBACK_URL')!,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<void> {
        const user = await this.users.findOrCreate({
            googleId: profile.id,
            email: profile.emails?.[0]?.value ?? '',
            name: profile.displayName ?? '',
            picture: profile.photos?.[0]?.value ?? null,
        });
        done(null, user);
    }
}
