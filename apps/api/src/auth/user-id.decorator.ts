import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Lê o id do usuário que o OptionalAuthGuard colocou em req.userId (ou null). */
export const UserId = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): string | null => {
        const req = ctx.switchToHttp().getRequest();
        return req.userId ?? null;
    },
);
