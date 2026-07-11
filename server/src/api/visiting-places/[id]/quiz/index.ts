import { requireAuth } from 'express-file-cluster/auth';
import type { Request, Response } from 'express';
import { Quiz } from '../../../../model/Quiz.js';
import type { QuizQuestion } from '../../../../model/Quiz.js';
import { QuizAttempt } from '../../../../model/QuizAttempt.js';
import { VisitingPlace } from '../../../../model/VisitingPlace.js';
import { getOrCreateLedger } from '../../../../lib/arPoints.js';
import { hasCompletedPlace } from '../../../../lib/tripSummaries.js';
import type { RouteMeta } from 'express-file-cluster';

export const meta: RouteMeta = {
  GET: {
    description: "The visiting place's optional quiz. Locked (no questions) until the caller has completed the place; correct answers are always stripped.",
    request: { params: { id: '64f0...' } },
    response: { status: 200, body: { locked: false, quiz: { id: 'q1', questions: [{ question: 'Q?', options: ['a', 'b'] }] }, attempted: false, earned_points: 0 } },
  },
  PUT: {
    description: 'Create or replace the quiz for a visiting place — exactly 5 questions (admin only).',
    request: { params: { id: '64f0...' }, body: { questions: [{ question: 'Q?', options: ['a', 'b', 'c'], correct_index: 0 }] } },
    response: { status: 200, body: { message: 'Quiz saved', quiz: {} } },
  },
};

export const middlewares = [requireAuth('user', 'admin')];

export const GET = async (req: Request, res: Response) => {
  const quiz = await Quiz.findOne({ visiting_place_id: req.params.id });
  if (!quiz) return res.status(404).json({ error: 'This place has no quiz yet.' });

  const { id: userId, role } = (req as any).user;

  // The quiz unlocks only after the whole place is completed. Admins bypass
  // the lock so they can preview what they authored.
  if (role !== 'admin' && !(await hasCompletedPlace(userId, req.params.id))) {
    return res.json({ locked: true, attempted: false, earned_points: 0 });
  }

  const [ledger, attemptRecord] = await Promise.all([
    getOrCreateLedger(userId),
    QuizAttempt.findOne({ user_id: userId, quiz_id: quiz.id }),
  ]);
  const ledgerEntry = ledger.entries.find((e) => e.source === 'quiz' && e.ref_id === quiz.id);

  res.json({
    locked: false,
    quiz: {
      id: quiz.id,
      questions: quiz.questions.map(({ question, options }) => ({ question, options })),
    },
    attempted: !!ledgerEntry || !!attemptRecord,
    earned_points: attemptRecord?.points ?? ledgerEntry?.points ?? 0,
    // Correct answers are only revealed once the one allowed attempt is spent.
    // Attempts from before answer-storage existed still get the answer key,
    // just without the user's own picks.
    review: attemptRecord
      ? {
          answers: attemptRecord.answers,
          correct_indexes: quiz.questions.map((q) => q.correct_index),
          correct_count: attemptRecord.correct_count,
        }
      : ledgerEntry
        ? {
            answers: [],
            correct_indexes: quiz.questions.map((q) => q.correct_index),
            correct_count: null,
          }
        : null,
  });
};

export const PUT = async (req: Request, res: Response) => {
  if ((req as any).user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const place = await VisitingPlace.findById(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });

  const questions = req.body.questions as QuizQuestion[] | undefined;
  if (!Array.isArray(questions) || questions.length !== 5) {
    return res.status(400).json({ error: 'A quiz must have exactly 5 questions.' });
  }
  for (const q of questions) {
    if (
      typeof q.question !== 'string' || !q.question.trim() ||
      !Array.isArray(q.options) || q.options.length < 2 || q.options.some((o) => typeof o !== 'string' || !o.trim()) ||
      typeof q.correct_index !== 'number' || q.correct_index < 0 || q.correct_index >= q.options.length
    ) {
      return res.status(400).json({ error: 'Each question needs text, at least 2 options and a valid correct_index.' });
    }
  }

  const existing = await Quiz.findOne({ visiting_place_id: req.params.id });
  const quiz = existing
    ? await Quiz.update(existing.id, { questions })
    : await Quiz.create({ visiting_place_id: req.params.id, questions });

  res.json({ message: 'Quiz saved', quiz });
};
