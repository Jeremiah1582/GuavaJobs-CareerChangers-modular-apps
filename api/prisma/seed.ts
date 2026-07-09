import {
  PrismaClient,
  ProfileIndustry,
  SeniorityLevel,
  UserTier,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const seedUserId = process.env.SEED_USER_ID;
  if (!seedUserId) {
    console.log(
      'Skipping user seed: set SEED_USER_ID to a Supabase Auth UUID (optional for local demo data).',
    );
    return;
  }
  const seedEmail =
    process.env.SEED_USER_EMAIL ?? 'demo@guavajobs.local';
  const seedName = process.env.SEED_USER_NAME ?? 'Demo User';

  const user = await prisma.user.upsert({
    where: { id: seedUserId },
    create: {
      id: seedUserId,
      email: seedEmail,
      name: seedName,
      tier: UserTier.FREE,
      aiGenerationsUsedPeriod: 0,
      usagePeriodStart: new Date(),
    },
    update: {
      email: seedEmail,
      name: seedName,
    },
  });

  const existingDefault = await prisma.profile.findFirst({
    where: { userId: user.id, isDefault: true },
  });

  if (!existingDefault) {
    await prisma.profile.create({
      data: {
        userId: user.id,
        profileTitle: 'Software Engineering',
        jobTitle: 'Full-Stack Developer',
        seniority: SeniorityLevel.MID,
        primaryIndustry: ProfileIndustry.SOFTWARE,
        skills: ['TypeScript', 'React', 'Node.js'],
        jobCategories: ['Engineering'],
        locationCity: 'London',
        locationCountry: 'GB',
        isDefault: true,
      },
    });
  }

  console.log(`Seed complete: user ${user.id} (${user.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
