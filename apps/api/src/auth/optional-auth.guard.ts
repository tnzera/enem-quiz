import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Guard "opcional": nunca bloqueia a rota. Se houver um JWT válido no
 * cabeçalho Authorization, coloca o id do usuário em req.userId.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtService) {}

    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest();
        const header: string | undefined = req.headers.authorization;
        if (header?.startsWith('Bearer ')) {
            try {
                const payload = this.jwt.verify<{ sub: string }>(header.slice(7));
                req.userId = payload.sub;
            } catch {
                /* token inválido → segue sem usuário */
            }
        }
        return true;
    }
}
