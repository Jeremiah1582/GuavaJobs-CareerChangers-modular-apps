-- AlterTable
ALTER TABLE "application_ats_reports" ADD COLUMN "gapsDetailed" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "application_ats_reports" ADD COLUMN "changeSummary" TEXT;
