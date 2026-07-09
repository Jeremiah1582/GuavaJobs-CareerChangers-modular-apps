import { PrismaService } from '../prisma/prisma.service';
import { AutofillPayload } from '../shared/schemas/autofill.schema';
export declare class AutofillService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPayload(userId: string, applicationId: string): Promise<AutofillPayload>;
}
