import * as kidRepo from '@/features/kid/repositories/kid';
import { drizzle } from 'drizzle-orm/node-postgres';

import { kidEnrollment } from '../schema';

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);

  const morningClassSessionId = '9bcdb224-c78f-4e81-90ce-f1d6632f5877';

  const currentTermId = 'b3048034-ea3b-42a0-a7b5-aa1fb52b4329';

  const kids = await kidRepo.findMany();
  // eslint-disable-next-line no-console
  console.log(`Found ${kids.length} kids`);

  if (kids.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No kids found. Nothing to seed.');
    return;
  }
  const kidsSeeds = kids.map((kid) => ({
    kidId: kid.id,
    termId: currentTermId,
    classSessionId: morningClassSessionId,
  }));

  await db.insert(kidEnrollment).values(kidsSeeds);
  // eslint-disable-next-line no-console
  console.log(`Seeded ${kidsSeeds.length} kid enrollments`);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
