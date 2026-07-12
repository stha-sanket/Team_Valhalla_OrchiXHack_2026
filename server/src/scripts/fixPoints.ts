import mongoose from 'mongoose';
import { UserProgress } from '../model/UserProgress.js';
import VisitingRoutes from '../model/VisitingRoutes.js';
import { User } from '../model/User.js';
import { awardPoints, MILESTONE_POINTS, SIDE_QUEST_POINTS } from '../lib/arPoints.js';

process.loadEnvFile?.();
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/server';

type WithId<T> = T & { id: string };
import type { UserProgressDocument } from '../model/UserProgress.js';
import type { RouteDocument } from '../model/VisitingRoutes.js';

async function main() {
  await mongoose.connect(DATABASE_URL);
  
  const allProgress = (await UserProgress.find({})) as WithId<UserProgressDocument>[];
  let fixedCount = 0;
  
  for (const progress of allProgress) {
    const userId = progress.user_id;
    for (const p of progress.route_progress) {
      if (!p.visited) continue;
      
      const route = (await VisitingRoutes.findById(p.route_id)) as WithId<RouteDocument> | null;
      if (!route) continue;
      
      if (route.type === 'milestone') {
        const awarded = await awardPoints(userId, { source: 'milestone', ref_id: route.id, label: route.name, points: MILESTONE_POINTS });
        
        const user = await User.findById(userId);
        if (user) {
          const existingMilestones = user.milestones ?? [];
          const alreadyEarned = existingMilestones.some((m: any) => m.name === route.name);
          if (!alreadyEarned) {
            const updatedMilestones = [
              ...existingMilestones,
              { name: route.name, earned_at: new Date().toISOString() },
            ];
            await User.update(user.id, { milestones: updatedMilestones });
            if (awarded !== null) {
              console.log(`[fix] Fixed points and milestone for user ${user.email} (route: ${route.name})`);
            } else {
              console.log(`[fix] Fixed missing milestone for user ${user.email} (route: ${route.name})`);
            }
            fixedCount++;
          } else if (awarded !== null) {
             console.log(`[fix] Fixed missing points for user ${user.email} (route: ${route.name})`);
             fixedCount++;
          }
        }
      } else if (route.type === 'side_quest') {
        const awarded = await awardPoints(userId, { source: 'side_quest', ref_id: route.id, label: route.name, points: SIDE_QUEST_POINTS });
        if (awarded !== null) {
          console.log(`[fix] Fixed missing points for user ${userId} for side quest (route: ${route.name})`);
          fixedCount++;
        }
      }
    }
  }
  
  console.log(`[fix] Done. Fixed ${fixedCount} missing awards/milestones.`);
}

main().catch(console.error).finally(() => mongoose.disconnect());
