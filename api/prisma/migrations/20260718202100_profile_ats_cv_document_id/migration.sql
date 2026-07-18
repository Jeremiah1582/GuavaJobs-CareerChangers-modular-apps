-- AlterTable
ALTER TABLE "profile_ats_assessments" ADD COLUMN     "cvDocumentId" TEXT;

-- CreateIndex
CREATE INDEX "profile_ats_assessments_cvDocumentId_idx" ON "profile_ats_assessments"("cvDocumentId");
