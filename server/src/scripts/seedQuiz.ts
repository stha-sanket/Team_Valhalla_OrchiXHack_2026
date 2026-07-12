import mongoose from 'mongoose';
import { VisitingPlace } from '../model/VisitingPlace.js';
import { Quiz } from '../model/Quiz.js';
import type { QuizQuestion } from '../model/Quiz.js';

process.loadEnvFile?.();

const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/server';

const QUIZZES: { placeName: string; questions: QuizQuestion[] }[] = [
  {
    placeName: 'Orchid College',
    questions: [
      {
        // TODO: confirm the real number of parking spots and fix correct_index.
        question: 'How many parking spots are there at the Orchid parking area?',
        options: ['15', '20', '25', '30'],
        correct_index: 2,
      },
      {
        // TODO: confirm the real 2022 scholarship recipient and fix correct_index.
        question: 'Who received the 2022 scholarship at Orchid College?',
        options: ['Abinash Adhikari', 'Rishu Prajapati', 'Sunita Shrestha', 'Bikash Thapa'],
        correct_index: 0,
      },
      {
        question: 'Where is the futsal court located?',
        options: ['Behind the canteen', 'In the management block', 'Next to the parking area', 'On the rooftop'],
        correct_index: 1,
      },
      {
        question: 'How many turns do you take along the campus walk?',
        options: ['2', '3', '4', '5'],
        correct_index: 1, // Right turn → Left turn → Left turn
      },
      {
        question: 'Where does the campus walk end?',
        options: ['Orchid College of Management', 'Orchid Parking Area', 'Bishwajit Medical Hall', 'Orchid International College'],
        correct_index: 3,
      },
    ],
  },
  {
    placeName: 'Orchid hackathon',
    questions: [
      {
        question: 'Which game can you play during breaks at the hackathon venue?',
        options: ['Foosball', 'Table tennis', 'Chess', 'Carrom'],
        correct_index: 1,
      },
      {
        question: 'Where do participants grab food and drinks at the venue?',
        options: ['The canteen', 'A food truck outside', 'Vending machines', 'The rooftop café'],
        correct_index: 0,
      },
      {
        question: 'How many players face each other in a singles table tennis match?',
        options: ['1 vs 1', '2 vs 2', '3 vs 3', '1 vs 2'],
        correct_index: 0,
      },
      {
        question: 'What do you need to rally at the table tennis table?',
        options: ['A racket and shuttlecock', 'A paddle and ball', 'A cue and chalk', 'A bat and stumps'],
        correct_index: 1,
      },
      {
        // TODO: confirm what the canteen is actually known for and fix correct_index.
        question: 'What is the canteen best known for serving?',
        options: ['Tea and snacks', 'Sushi', 'Barbecue', 'Ice cream only'],
        correct_index: 0,
      },
    ],
  },
  {
    placeName: 'Pashupatinath Temple',
    questions: [
      {
        question: 'What color is Gate no. 3?',
        options: ['Red', 'Green', 'Yellow', 'Blue'],
        correct_index: 2,
      },
      {
        question: 'What building is located on the right side straight from the main gate?',
        options: ['Nabil Bank', 'Nepal sbi bank', 'Everest Bank', 'Himalayan Bank'],
        correct_index: 1,
      },
      {
        question: 'What is featured on the yellow coloured main Pashupatinath gate?',
        options: ['Sculpture of Shiva', 'Sculpture of Vishnu', 'Sculpture of Buddha', 'Sculpture of Ganesh'],
        correct_index: 0,
      },
      {
        question: 'Which checkpoint is designated as the end of the route?',
        options: ['Nepal sbi bank', 'Gate no. 3', 'Main gate', 'Main temple'],
        correct_index: 3,
      },
      {
        question: 'What are you not allowed to take to the main temple?',
        options: ['Water bottle', 'Bag', 'Phone', 'Shoes'],
        correct_index: 2,
      },
    ],
  },
];

async function main() {
  await mongoose.connect(DATABASE_URL);

  for (const { placeName, questions } of QUIZZES) {
    const place = await VisitingPlace.findOne({ name: placeName });
    if (!place) {
      console.warn(`[seed] Place "${placeName}" not found — skipped. Run its place seed first.`);
      continue;
    }

    const existing = await Quiz.findOne({ visiting_place_id: place.id });
    if (existing) {
      await Quiz.update(existing.id, { questions });
      console.log(`[seed] Refreshed quiz for "${placeName}" (${questions.length} questions).`);
    } else {
      await Quiz.create({ visiting_place_id: place.id, questions });
      console.log(`[seed] Created quiz for "${placeName}" (${questions.length} questions).`);
    }
  }
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
