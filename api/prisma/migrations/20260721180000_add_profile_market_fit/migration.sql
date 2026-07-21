-- CreateTable
CREATE TABLE "profile_market_fits" (
    "profileId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "inputFingerprint" TEXT NOT NULL,
    "regionCountry" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_market_fits_pkey" PRIMARY KEY ("profileId")
);

-- AddForeignKey
ALTER TABLE "profile_market_fits" ADD CONSTRAINT "profile_market_fits_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
