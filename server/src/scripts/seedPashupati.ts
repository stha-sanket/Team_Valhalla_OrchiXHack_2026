import mongoose from "mongoose";
import { VisitingPlace } from "../model/VisitingPlace.js";
import VisitingRoutes from "../model/VisitingRoutes.js";
import type { RouteDocument } from "../model/VisitingRoutes.js";
import { UserProgress } from "../model/UserProgress.js";
import type { UserProgressDocument } from "../model/UserProgress.js";

process.loadEnvFile?.();

const DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost:27017/server";

type WithId<T> = T & { id: string };

const PLACE = {
  name: "Pashupatinath Temple",
  description: "A guided walk through the sacred Pashupatinath Temple.",
  lat: "27.710341",
  long: "85.349026",
  badge:
    "https://res.cloudinary.com/drddkl4on/image/upload/v1783793888/badge_avgnui.png",
  visit_threshold_meters: 10,
};

const POINTS = [
  {
    name: "Main Gate",
    type: "start",
    index: 0,
    coordinates: { lat: "27.712387", long: "85.347429" },
    media:
      "https://res.cloudinary.com/drddkl4on/image/upload/v1783792013/ae14b2da-1d98-4ca5-a99d-3fd77dabf555.png",
    description: "Starting point — main gate",
  },
  {
    name: "Religious virtue: place your shoes on the shoe rack",
    type: "milestone",
    index: 1,
    coordinates: { lat: "27.711337", long: "85.347215" },
    media:
      "https://res.cloudinary.com/drddkl4on/image/upload/v1783792379/6f8d0e7d-7275-4649-add3-29727c7e52b8.png",
    description: "Religious virtue: place your shoes on the shoe",
  },
  {
    name: "Gate no.3",
    type: "node",
    index: 2,
    coordinates: { lat: "27.710980", long: "85.347078" },
    media:
      "https://res.cloudinary.com/p8hr2mve/image/upload/v1783756022/main_gate_vmsrok.jpg",
    description: "Turn left for the yellow gate no. 3.",
  },
  {
    name: "Nepal sbi bank",
    type: "node",
    index: 3,
    coordinates: { lat: "27.710789", long: "85.347802" },
    media:
      "https://res.cloudinary.com/p8hr2mve/image/upload/v1783759387/sbi_bank_z67e1t.jpg",
    description: "St from the main gate and right side the 1st white building.",
  },
  {
    name: "Nandi Statue",
    type: "node",
    index: 4,
    coordinates: { lat: "27.710721", long: "85.348191" },
    model3d:
      "https://res.cloudinary.com/drddkl4on/image/upload/v1783822268/150th_model_-_golden_ox_w3_lod_-_nepal_heritage_asdv3m.glb",
    description:
      "Nandi is the sacred bull and divine vehicle (vahana) of Lord Shiva, traditionally placed facing the main sanctum as an eternal devotee keeping watch over the deity. This bronze Nandi statue, seated just before the main Pashupatinath gate, has stood here for generations of pilgrims and is one of the most photographed shrines on the approach to the temple. In Hindu iconography, Nandi represents strength, virility, and unwavering devotion — pilgrims traditionally pause here to seek blessings before proceeding to the main temple.",
  },
  {
    name: "Main pashupatinath gate",
    type: "milestone",
    index: 5,
    coordinates: { lat: "27.710706", long: "85.348261" },
    media:
      "https://res.cloudinary.com/p8hr2mve/image/upload/v1783759932/pashupati_temple_gate_d2bdga.jpg",
    video:
      "https://res.cloudinary.com/drddkl4on/video/upload/v1783793419/pashupati_vrxqgw.mp4",
    description:
      "St from sbi bank until u reach a yellow coloured gate having the sculpture of shiva.",
  },
  {
    name: "Main temple",
    type: "end",
    index: 6,
    coordinates: { lat: "27.710341", long: "85.349026" },
    media:
      "https://res.cloudinary.com/p8hr2mve/image/upload/v1783762084/main_temple_ir9w88.jpg",
    description: "You are not allowed to take the phone here.",
  },
];

async function main() {
  await mongoose.connect(DATABASE_URL);

  let place = await VisitingPlace.findOne({ name: PLACE.name });
  if (place) {
    await VisitingPlace.update(place.id, PLACE);

    // Route ids change on reseed, so stale routes AND progress referencing them must go.
    const oldRoutes = (await VisitingRoutes.find({
      visiting_place_id: place.id,
    })) as WithId<RouteDocument>[];
    await Promise.all(oldRoutes.map((r) => VisitingRoutes.delete(r.id)));
    const oldProgress = (await UserProgress.find({
      visiting_place_id: place.id,
    })) as WithId<UserProgressDocument>[];
    await Promise.all(oldProgress.map((p) => UserProgress.delete(p.id)));

    console.log(
      `[seed] Refreshed "${PLACE.name}" — removed ${oldRoutes.length} route points and ${oldProgress.length} progress records.`,
    );
  } else {
    place = await VisitingPlace.create(PLACE);
    console.log(`[seed] Created place "${PLACE.name}" (id: ${place.id})`);
  }

  for (const point of POINTS) {
    await VisitingRoutes.create({ ...point, visiting_place_id: place.id });
  }
  console.log(
    `[seed] Created ${POINTS.length} route points for "${PLACE.name}".`,
  );
}

main()
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
