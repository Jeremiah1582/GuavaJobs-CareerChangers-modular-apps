import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser, JwtClaims } from './auth.types';
export declare class AuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    claimsToAuthUser(claims: JwtClaims): AuthenticatedUser;
    syncUser(authUser: AuthenticatedUser): Promise<User>;
    private rekeyUser;
    private ensureDefaultProfile;
}
