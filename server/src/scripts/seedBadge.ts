import mongoose from 'mongoose';
import { VisitingPlace } from '../model/VisitingPlace.js';
import type { VisitingPlaceDocument } from '../model/VisitingPlace.js';

process.loadEnvFile?.();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/server';
const badge = process.env.SEED_BADGE_URL || 'https://res.cloudinary.com/drddkl4on/image/upload/v1783705278/hack_x_logo-CXqxm56r_ua1rmb.png';

// find()'s type signature doesn't intersect `& { id: string }` the way findById/findOne/create do,
// even though the runtime always attaches id (see normalise() in the framework's model.ts).
type WithId<T> = T & { id: string };

async function main() {
  await mongoose.connect(DATABASE_URL);

  const places = (await VisitingPlace.find({})) as WithId<VisitingPlaceDocument>[];
  if (places.length === 0) {
    console.log('[seed] No visiting places found — create one first.');
    return;
  }

  const first = places[0];
  await VisitingPlace.update(first.id, { badge });
  console.log(`[seed] Badge set on "${first.name}" (id: ${first.id})`);
  console.log(`[seed] → ${badge}`);
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
