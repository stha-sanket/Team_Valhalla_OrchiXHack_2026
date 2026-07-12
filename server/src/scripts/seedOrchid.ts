import mongoose from 'mongoose';
import { VisitingPlace } from '../model/VisitingPlace.js';
import VisitingRoutes from '../model/VisitingRoutes.js';
import type { RouteDocument } from '../model/VisitingRoutes.js';
import { UserProgress } from '../model/UserProgress.js';
import type { UserProgressDocument } from '../model/UserProgress.js';

process.loadEnvFile?.();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/server';

// find()'s type signature doesn't intersect `& { id: string }` the way findById/findOne/create do,
// even though the runtime always attaches id (see normalise() in the framework's model.ts).
type WithId<T> = T & { id: string };

// Source: orchid.txt
const PLACE = {
  name: 'Orchid College',
  description: 'A guided walk from Orchid College of Management to Orchid International College.',
  lat: '27.702247',
  long: '85.346473',
  badge: 'https://www.oic.edu.np/wp-content/uploads/2020/05/logo.png',
  visit_threshold_meters: 10,
};

const POINTS = [
  {
    name: 'Orchid college of Management',
    type: 'start',
    index: 0,
    coordinates: { lat: '27.702018', long: '85.348198' },
    media: 'https://res.cloudinary.com/drddkl4on/image/upload/v1783706336/64956ae6-cf4c-42cc-bbe9-766432afd993.png',
    description: 'Starting point — Orchid College of Management.',
  },
  {
    name: 'Right turn',
    type: 'node',
    index: 1,
    coordinates: { lat: '27.702294', long: '85.347675' },
    media: 'https://res.cloudinary.com/drddkl4on/image/upload/v1783706432/7476da40-c525-4e1f-aad4-7203aa09ee01.png',
    description: 'Take a right turn from here.',
  },
  {
    name: 'Visit Orchid Parking Area',
    type: 'milestone',
    index: 2,
    coordinates: { lat: '27.701960', long: '85.347353' },
    // TODO: add a photo of the parking area in `media`.
    video: 'https://res.cloudinary.com/drddkl4on/video/upload/v1783706749/random_d4qr3i.mp4',
    description: 'Watch the story of the Orchid parking area.',
  },
  {
    name: 'Left turn',
    type: 'node',
    index: 3,
    coordinates: { lat: '27.701961', long: '85.347259' },
    media: 'https://res.cloudinary.com/drddkl4on/image/upload/v1783706432/7476da40-c525-4e1f-aad4-7203aa09ee01.png',
    description: 'Take a left turn from here.',
  },
  {
    name: 'Visit Bishwajit Medical Hall',
    type: 'side_quest',
    index: 4,
    coordinates: { lat: '27.702062', long: '85.347112' },
    // TODO: add a photo of Bishwajit Medical Hall in `media`.
    video: 'https://res.cloudinary.com/drddkl4on/video/upload/v1783706985/random2_la9nih.mp4',
    description: 'Optional side quest — spend at least 5 minutes at Bishwajit Medical Hall.',
  },
  {
    name: 'Left turn',
    type: 'node',
    index: 5,
    coordinates: { lat: '27.702437', long: '85.346749' },
    media: 'https://res.cloudinary.com/drddkl4on/image/upload/v1783707271/8316b035-d76b-4d7b-b29e-1d4b2c253c8a.png',
    description: 'Turn here and continue along the route.',
  },
  {
    name: 'Visit Orchid International College',
    type: 'milestone',
    index: 6,
    coordinates: { lat: '27.702317', long: '85.346659' },
    // TODO: add a photo of Orchid International College in `media`.
    video: 'https://res.cloudinary.com/drddkl4on/video/upload/v1783707578/Abinash_Adhikari____Student_s_Testimonial_2____University_Topper_2080____TU_Top____acn2qz.mp4',
    description: 'Watch a student testimonial from Orchid International College.',
  },
  {
    name: 'Orchid International College',
    type: 'end',
    index: 7,
    coordinates: { lat: '27.702247', long: '85.346473' },
    media: 'https://res.cloudinary.com/drddkl4on/image/upload/v1783707675/61950144-b202-443d-ae8b-8d6b2c01e482.png',
    description: 'You have reached Orchid International College — the end of the route.',
  },
];

async function main() {
  await mongoose.connect(DATABASE_URL);

  let place = await VisitingPlace.findOne({ name: PLACE.name });
  if (place) {
    await VisitingPlace.update(place.id, PLACE);

    // Route ids change on reseed, so stale routes AND progress referencing them must go.
    const oldRoutes = (await VisitingRoutes.find({ visiting_place_id: place.id })) as WithId<RouteDocument>[];
    await Promise.all(oldRoutes.map((r) => VisitingRoutes.delete(r.id)));
    const oldProgress = (await UserProgress.find({ visiting_place_id: place.id })) as WithId<UserProgressDocument>[];
    await Promise.all(oldProgress.map((p) => UserProgress.delete(p.id)));

    console.log(`[seed] Refreshed "${PLACE.name}" — removed ${oldRoutes.length} route points and ${oldProgress.length} progress records.`);
  } else {
    place = await VisitingPlace.create(PLACE);
    console.log(`[seed] Created place "${PLACE.name}" (id: ${place.id})`);
  }

  for (const point of POINTS) {
    await VisitingRoutes.create({ ...point, visiting_place_id: place.id });
  }
  console.log(`[seed] Created ${POINTS.length} route points for "${PLACE.name}".`);
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
