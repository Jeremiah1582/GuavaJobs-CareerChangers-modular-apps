-- AlterTable
ALTER TABLE "application_ats_reports" ADD COLUMN "suggestedRoles" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "application_ats_reports" ADD COLUMN "careerSuggestion" TEXT;
