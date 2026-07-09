import { PrismaService } from '../prisma/prisma.service';
import { PatchMeInput, UserResponse } from '../shared/schemas/user.schema';
import { UsageService } from './usage.service';
export declare class UsersService {
    private readonly prisma;
    private readonly usage;
    constructor(prisma: PrismaService, usage: UsageService);
    getMe(userId: string): Promise<UserResponse>;
    patchMe(userId: string, input: PatchMeInput): Promise<UserResponse>;
    private toUserResponse;
}
