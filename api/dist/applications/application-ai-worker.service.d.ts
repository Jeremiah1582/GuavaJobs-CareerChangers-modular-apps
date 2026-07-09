import { AtsReportGenerator } from '../ai/ats-report.generator';
import { CoverLetterGenerator } from '../ai/cover-letter.generator';
import { JobFactsParser } from '../ai/job-facts.parser';
import { JobsService } from '../jobs/jobs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsageService } from '../users/usage.service';
import { AiGenerationJobData } from '../queue/queue.constants';
import { ApplicationSnapshotService } from './application-snapshot.service';
export declare class ApplicationAiWorkerService {
    private readonly prisma;
    private readonly jobs;
    private readonly snapshots;
    private readonly coverLetterGen;
    private readonly atsReportGen;
    private readonly jobFacts;
    private readonly usage;
    private readonly logger;
    constructor(prisma: PrismaService, jobs: JobsService, snapshots: ApplicationSnapshotService, coverLetterGen: CoverLetterGenerator, atsReportGen: AtsReportGenerator, jobFacts: JobFactsParser, usage: UsageService);
    process(job: AiGenerationJobData): Promise<void>;
    private runFullGenerate;
    private runRegenerate;
    private runHybridCoverLetter;
    private runHybridAtsReport;
}
