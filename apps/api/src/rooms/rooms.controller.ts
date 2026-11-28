import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { UserId } from '../auth/user-id.decorator';

function requireUser(userId: string | null): string {
    if (!userId) throw new UnauthorizedException('Faça login para jogar em sala.');
    return userId;
}

@Controller('rooms')
@UseGuards(OptionalAuthGuard)
export class RoomsController {
    constructor(private readonly rooms: RoomsService) {}

    /** Cria a sala (o criador já entra) e devolve o código. */
    @Post()
    create(
        @UserId() userId: string | null,
        @Body() body: { durationMinutes: number; questionCount: number },
    ) {
        return this.rooms.create(
            requireUser(userId),
            Number(body?.durationMinutes),
            Number(body?.questionCount),
        );
    }

    @Post(':code/join')
    join(@UserId() userId: string | null, @Param('code') code: string) {
        return this.rooms.join(code, requireUser(userId));
    }

    @Post(':code/start')
    start(@UserId() userId: string | null, @Param('code') code: string) {
        return this.rooms.start(code, requireUser(userId));
    }

    /** Estado da sala para o participante (o front consulta periodicamente). */
    @Get(':code')
    view(@UserId() userId: string | null, @Param('code') code: string) {
        return this.rooms.view(code, requireUser(userId));
    }

    @Post(':code/answer')
    answer(
        @UserId() userId: string | null,
        @Param('code') code: string,
        @Body() body: { choice: string },
    ) {
        return this.rooms.answer(code, requireUser(userId), body?.choice);
    }
}
