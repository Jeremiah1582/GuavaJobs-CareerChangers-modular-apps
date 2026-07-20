-- CreateTable
CREATE TABLE "profile_career_cvs" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "enrichments" JSONB NOT NULL DEFAULT '[]',
    "sourceCvDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_career_cvs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_career_cvs_profileId_key" ON "profile_career_cvs"("profileId");

-- CreateIndex
CREATE INDEX "profile_career_cvs_userId_idx" ON "profile_career_cvs"("userId");

-- AddForeignKey
ALTER TABLE "profile_career_cvs" ADD CONSTRAINT "profile_career_cvs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_career_cvs" ADD CONSTRAINT "profile_career_cvs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
