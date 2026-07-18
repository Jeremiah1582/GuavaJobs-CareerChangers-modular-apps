-- AlterTable
ALTER TABLE "profile_ats_assessments" ADD COLUMN     "checklist" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "priorityActions" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "strengths" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "summary" TEXT;
