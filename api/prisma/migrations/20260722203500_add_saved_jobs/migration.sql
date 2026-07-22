-- CreateEnum
CREATE TYPE "SavedJobResolveStatus" AS ENUM ('LIVE', 'GONE', 'UNKNOWN');

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "title" TEXT,
    "company" TEXT,
    "location" TEXT,
    "atsType" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT,
    "lastResolvedAt" TIMESTAMP(3),
    "resolveStatus" "SavedJobResolveStatus" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_jobs_userId_savedAt_idx" ON "saved_jobs"("userId", "savedAt");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_userId_canonicalKey_key" ON "saved_jobs"("userId", "canonicalKey");

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
