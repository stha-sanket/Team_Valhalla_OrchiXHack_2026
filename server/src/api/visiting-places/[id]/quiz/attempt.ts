import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { Quiz } from '../../../../model/Quiz.js';
import { QuizAttempt } from '../../../../model/QuizAttempt.js';
import { VisitingPlace } from '../../../../model/VisitingPlace.js';
import { awardPoints, QUIZ_POINTS_BY_CORRECT } from '../../../../lib/arPoints.js';
import { hasCompletedPlace } from '../../../../lib/tripSummaries.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  POST: {
    description: 'Submit quiz answers (one attempt per quiz, ever). Grades them, pays out AR points, and reveals the correct answers.',
    request: { params: { id: '64f0...' }, body: { answers: [0, 2, 1, 3, 0] } },
    response: { status: 200, body: { correct_count: 4, points_awarded: 30, correct_indexes: [0, 1, 1, 3, 2] } },
  },
};

export const middlewares = [requireAuth('user')];

export const POST = async (req: Request, res: Response) => {
  const place = await VisitingPlace.findById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });

  const quiz = await Quiz.findOne({ visiting_place_id: req.params.id });
  if (!quiz) return res.status(404).json({ error: 'This place has no quiz yet.' });

  const { id: userId } = (req as any).user;
  if (!(await hasCompletedPlace(userId, req.params.id))) {
    return res.status(403).json({ error: 'Complete every checkpoint of this place to unlock the quiz.' });
  }

  const answers = req.body.answers as unknown;
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length || answers.some((a) => typeof a !== 'number')) {
    return res.status(400).json({ error: `Expected answers as an array of ${quiz.questions.length} option indexes.` });
  }

  const correctCount = quiz.questions.reduce((sum, q, i) => sum + (q.correct_index === answers[i] ? 1 : 0), 0);
  const points = QUIZ_POINTS_BY_CORRECT[correctCount] ?? 0;

  const awarded = await awardPoints(userId, {
    source: 'quiz',
    ref_id: quiz.id,
    label: `Quiz · ${place.name}`,
    points,
  });
  if (awarded === null) {
    return res.status(409).json({ error: 'You have already attempted this quiz.' });
  }

  // Keep the submitted answers so the user can review them against the
  // correct ones later.
  await QuizAttempt.create({
    user_id: userId,
    quiz_id: quiz.id,
    answers: answers as number[],
    correct_count: correctCount,
    points,
  });

  res.json({
    correct_count: correctCount,
    points_awarded: points,
    correct_indexes: quiz.questions.map((q) => q.correct_index),
  });
};
