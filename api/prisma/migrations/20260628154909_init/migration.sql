-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "SeniorityLevel" AS ENUM ('INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE', 'C_LEVEL');

-- CreateEnum
CREATE TYPE "SalaryPeriod" AS ENUM ('ANNUAL', 'MONTHLY', 'HOURLY');

-- CreateEnum
CREATE TYPE "CvParseStatus" AS ENUM ('PENDING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'APPLIED', 'INTERVIEWING', 'OFFER', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'HIRED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationGenerationMode" AS ENUM ('AI', 'MANUAL');

-- CreateEnum
CREATE TYPE "ApplicationRejectionPhase" AS ENUM ('PRE_INTERVIEW', 'POST_INTERVIEW');

-- CreateEnum
CREATE TYPE "CoverLetterSource" AS ENUM ('AI', 'MANUAL');

-- CreateEnum
CREATE TYPE "ApplicationEventType" AS ENUM ('RESPONSE', 'INTERVIEW', 'NOTE', 'NEXT_STEP', 'STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "ProfileIndustry" AS ENUM ('SOFTWARE', 'SALES', 'DATA_ANALYSIS', 'FINANCE', 'HR', 'MARKETING', 'OPERATIONS', 'PRODUCT', 'DESIGN', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imgUrl" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "tier" "UserTier" NOT NULL DEFAULT 'FREE',
    "ai_generations_used_period" INTEGER NOT NULL DEFAULT 0,
    "usagePeriodStart" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileTitle" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "seniority" "SeniorityLevel" NOT NULL,
    "primaryIndustry" "ProfileIndustry" NOT NULL,
    "summary" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jobCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "locationCity" TEXT,
    "locationCountry" TEXT,
    "contactPhone" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT DEFAULT 'GBP',
    "salaryPeriod" "SalaryPeriod" DEFAULT 'ANNUAL',
    "autofillAnswers" JSONB DEFAULT '{}',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "currentCvId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_documents" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "parsedText" TEXT,
    "parseStatus" "CvParseStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_ats_assessments" (
    "profileId" TEXT NOT NULL,
    "industry" "ProfileIndustry" NOT NULL,
    "score" INTEGER NOT NULL,
    "missingKeywords" JSONB NOT NULL DEFAULT '[]',
    "suggestions" JSONB NOT NULL DEFAULT '[]',
    "breakdown" JSONB NOT NULL DEFAULT '{}',
    "inputFingerprint" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_ats_assessments_pkey" PRIMARY KEY ("profileId")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "generationMode" "ApplicationGenerationMode" NOT NULL DEFAULT 'AI',
    "canonicalJobKey" TEXT,
    "applyUrl" TEXT,
    "jobSnapshot" JSONB,
    "profileSnapshot" JSONB,
    "cvSnapshot" JSONB,
    "cvStorageKey" TEXT,
    "snapshottedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generationStatus" "ApplicationGenerationStatus",
    "generationError" TEXT,
    "pastedJobDescription" TEXT,
    "companyName" TEXT,
    "jobRoleTitle" TEXT,
    "jobLocation" TEXT,
    "jobWebsite" TEXT,
    "industry" TEXT,
    "sourceOfListing" TEXT,
    "languageRequired" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jobStartDate" TIMESTAMP(3),
    "jobSalaryMin" INTEGER,
    "jobSalaryMax" INTEGER,
    "jobSalaryCurrency" TEXT,
    "jobSalaryPeriod" "SalaryPeriod",
    "jobSalaryRaw" TEXT,
    "userFitRating" INTEGER,
    "coverLetterContent" TEXT,
    "coverLetterTemplateId" TEXT NOT NULL DEFAULT 'classic',
    "coverLetterSource" "CoverLetterSource" NOT NULL DEFAULT 'AI',
    "coverLetterEdited" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "rejectionPhase" "ApplicationRejectionPhase",
    "rejectedAt" TIMESTAMP(3),
    "contactName" TEXT,
    "interviewScheduledAt" TIMESTAMP(3),
    "interviewRound" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_ats_reports" (
    "applicationId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "letterScore" INTEGER,
    "cvScore" INTEGER,
    "missingKeywords" JSONB NOT NULL DEFAULT '[]',
    "suggestions" JSONB NOT NULL DEFAULT '[]',
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "gaps" JSONB NOT NULL DEFAULT '[]',
    "actionableSteps" JSONB NOT NULL DEFAULT '[]',
    "keywordCoverage" JSONB NOT NULL DEFAULT '{}',
    "icpMatch" JSONB NOT NULL DEFAULT '{}',
    "breakdown" JSONB NOT NULL DEFAULT '{}',
    "inputFingerprint" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_ats_reports_pkey" PRIMARY KEY ("applicationId")
);

-- CreateTable
CREATE TABLE "application_events" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "eventType" "ApplicationEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "contactName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_currentCvId_key" ON "profiles"("currentCvId");

-- CreateIndex
CREATE INDEX "profiles_userId_idx" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_userId_isDefault_idx" ON "profiles"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "cv_documents_profileId_idx" ON "cv_documents"("profileId");

-- CreateIndex
CREATE INDEX "cv_documents_profileId_isActive_idx" ON "cv_documents"("profileId", "isActive");

-- CreateIndex
CREATE INDEX "applications_userId_idx" ON "applications"("userId");

-- CreateIndex
CREATE INDEX "applications_userId_status_idx" ON "applications"("userId", "status");

-- CreateIndex
CREATE INDEX "applications_userId_sourceOfListing_idx" ON "applications"("userId", "sourceOfListing");

-- CreateIndex
CREATE INDEX "applications_profileId_idx" ON "applications"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "applications_userId_canonicalJobKey_key" ON "applications"("userId", "canonicalJobKey");

-- CreateIndex
CREATE INDEX "application_events_applicationId_idx" ON "application_events"("applicationId");

-- CreateIndex
CREATE INDEX "application_events_applicationId_eventType_idx" ON "application_events"("applicationId", "eventType");

-- CreateIndex
CREATE INDEX "application_events_applicationId_occurredAt_idx" ON "application_events"("applicationId", "occurredAt");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_currentCvId_fkey" FOREIGN KEY ("currentCvId") REFERENCES "cv_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_documents" ADD CONSTRAINT "cv_documents_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_ats_assessments" ADD CONSTRAINT "profile_ats_assessments_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_ats_reports" ADD CONSTRAINT "application_ats_reports_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

