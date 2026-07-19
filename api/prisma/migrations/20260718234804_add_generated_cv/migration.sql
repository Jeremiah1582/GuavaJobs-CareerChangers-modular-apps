-- CreateEnum
CREATE TYPE "ApplicationCvChoice" AS ENUM ('UPLOADED', 'GENERATED');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "cvChoice" "ApplicationCvChoice" NOT NULL DEFAULT 'UPLOADED';

-- CreateTable
CREATE TABLE "generated_cvs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sourceCvDocumentId" TEXT,
    "content" JSONB NOT NULL,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT NOT NULL DEFAULT 'json-ats-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_cvs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "generated_cvs_applicationId_key" ON "generated_cvs"("applicationId");

-- CreateIndex
CREATE INDEX "generated_cvs_userId_idx" ON "generated_cvs"("userId");

-- CreateIndex
CREATE INDEX "generated_cvs_profileId_idx" ON "generated_cvs"("profileId");

-- AddForeignKey
ALTER TABLE "generated_cvs" ADD CONSTRAINT "generated_cvs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_cvs" ADD CONSTRAINT "generated_cvs_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_cvs" ADD CONSTRAINT "generated_cvs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
