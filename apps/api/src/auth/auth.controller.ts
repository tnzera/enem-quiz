import {
    Controller,
    Get,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import type { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly config: ConfigService,
        private readonly jwt: JwtService,
        private readonly users: UsersService,
    ) {}

    /** Inicia o login: o guard redireciona o navegador para o Google. */
    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleAuth(): void {
        // o AuthGuard cuida do redirect
    }

    /**
     * Retorno do Google: gera um JWT e redireciona para o front com o token
     */
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    googleCallback(@Req() req: Request, @Res() res: Response): void {
        const user = req.user as User;
        const token = this.jwt.sign({ sub: user.id });
        const front =
            this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
        res.redirect(`${front}/#token=${token}`);
    }

    /**lê o token do cabeçalho Authorization */
    @Get('me')
    async me(@Req() req: Request): Promise<User | null> {
        const token = this.extractToken(req);
        if (!token) return null;
        try {
            const payload = this.jwt.verify<{ sub: string }>(token);
            return (await this.users.findById(payload.sub)) ?? null;
        } catch {
            return null;
        }
    }

    /**confirmação. */
    @Post('logout')
    logout(): { ok: boolean } {
        return { ok: true };
    }

    private extractToken(req: Request): string | null {
        const header = req.headers.authorization;
        if (header?.startsWith('Bearer ')) return header.slice(7);
        return null;
    }
}
