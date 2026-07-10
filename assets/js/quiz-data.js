/**
 * Yatri AR — Cultural Quiz Data
 * 20 questions covering Nepal's heritage, religion, geography, and culture
 */

const QUIZ_DATA = {
  title: "Nepal Heritage Challenge",
  titleNp: "नेपाल सम्पदा प्रश्नोत्तरी",
  description: "Test your knowledge of Nepal's history, culture, and UNESCO World Heritage Sites.",
  totalQuestions: 20,

  categories: {
    heritage:   { label: "Heritage", color: "#f1c40f", emoji: "🏛️" },
    religion:   { label: "Religion", color: "#e67e22", emoji: "🛕" },
    geography:  { label: "Geography", color: "#16a085", emoji: "🗺️" },
    culture:    { label: "Culture",  color: "#9b59b6", emoji: "🎭" },
    history:    { label: "History",  color: "#c0392b", emoji: "📜" }
  },

  questions: [
    {
      id: 1,
      category: "heritage",
      question: "How many UNESCO World Heritage Sites are located in the Kathmandu Valley?",
      options: ["4", "5", "7", "9"],
      answer: 2, // index of correct option (7)
      explanation: "The Kathmandu Valley has 7 UNESCO World Heritage Sites: Pashupatinath, Swayambhunath, Boudhanath, Kathmandu Durbar Square, Patan Durbar Square, Bhaktapur Durbar Square, and Changu Narayan.",
      points: 10
    },
    {
      id: 2,
      category: "religion",
      question: "What does 'Swayambhunath' literally mean?",
      options: ["Temple of Monkeys", "Self-Existing", "Sacred Hill", "Eye of God"],
      answer: 1,
      explanation: "'Swayambhu' comes from Sanskrit meaning 'self-existing' or 'self-arisen'. Legend says the stupa arose spontaneously from a lotus in the prehistoric lake that once was the Kathmandu Valley.",
      points: 10
    },
    {
      id: 3,
      category: "history",
      question: "Which Malla king built the Krishna Mandir in Patan Durbar Square?",
      options: ["Bhupatindra Malla", "Siddhi Narasimha Malla", "Pratap Malla", "Jagat Jaya Malla"],
      answer: 1,
      explanation: "King Siddhi Narasimha Malla built the Krishna Mandir in 1637 CE after Krishna appeared to him in a dream. It is the only temple in Nepal built entirely of stone in the shikhara style.",
      points: 15
    },
    {
      id: 4,
      category: "geography",
      question: "In which district is Lumbini, the birthplace of the Buddha, located?",
      options: ["Kapilvastu", "Rupandehi", "Palpa", "Nawalparasi"],
      answer: 1,
      explanation: "Lumbini is located in Rupandehi district in the Lumbini Province of Nepal, near the Indian border. It lies in the flat Terai plains about 22km west of Bhairahawa.",
      points: 10
    },
    {
      id: 5,
      category: "culture",
      question: "What is 'juju dhau' — a specialty of Bhaktapur?",
      options: ["Rice wine", "King yogurt", "Spiced tea", "Sweet bread"],
      answer: 1,
      explanation: "Juju dhau (literally 'king curd') is a thick, sweet, creamy yogurt made in Bhaktapur and served in small clay pots. It has been a Newari culinary specialty for centuries.",
      points: 10
    },
    {
      id: 6,
      category: "heritage",
      question: "Who erected the famous pillar at Lumbini in 249 BCE?",
      options: ["King Ashoka", "King Prithvi Narayan Shah", "Emperor Akbar", "King Birendra"],
      answer: 0,
      explanation: "Emperor Ashoka of the Maurya dynasty visited Lumbini in 249 BCE and erected a pillar with an inscription confirming this as the birthplace of the Buddha. The pillar was rediscovered in 1896.",
      points: 10
    },
    {
      id: 7,
      category: "religion",
      question: "What is the 'kora' around Boudhanath stupa?",
      options: ["A prayer flag ceremony", "Clockwise circumambulation", "A fire offering", "A meditation retreat"],
      answer: 1,
      explanation: "The kora is the act of walking clockwise around a sacred Buddhist site. Pilgrims at Boudhanath spin prayer wheels as they perform the kora, accumulating merit with each circuit.",
      points: 10
    },
    {
      id: 8,
      category: "history",
      question: "Bhaktapur is known for which distinctive traditional craft?",
      options: ["Thangka painting", "Woodcarving and pottery", "Metalwork (repousse)", "Handwoven silk"],
      answer: 1,
      explanation: "Bhaktapur (Bhadgaon) is famous for its traditional wood carving and pottery. Pottery Square is where craftspeople still use traditional techniques with foot-powered wheels.",
      points: 10
    },
    {
      id: 9,
      category: "geography",
      question: "What is Nepal's timezone offset from UTC?",
      options: ["UTC+5:30", "UTC+5:45", "UTC+6:00", "UTC+5:15"],
      answer: 1,
      explanation: "Nepal Standard Time (NST) is UTC+5:45 — one of only two countries in the world (along with India's IST at UTC+5:30 as the closest) to use a 45-minute offset. This quirky offset historically set Nepal apart from India.",
      points: 15
    },
    {
      id: 10,
      category: "culture",
      question: "The Kumari is a living goddess in Nepal. What is she an incarnation of?",
      options: ["Saraswati", "Taleju Bhawani", "Durga", "Lakshmi"],
      answer: 1,
      explanation: "The Kumari is believed to be the living incarnation of the divine feminine energy, or Taleju Bhawani (also identified with Durga). She is selected from the Shakya caste of Newar Buddhists through a rigorous process.",
      points: 15
    },
    {
      id: 11,
      category: "heritage",
      question: "Which temple in Nepal is considered the oldest?",
      options: ["Pashupatinath Temple", "Changu Narayan Temple", "Swayambhunath Stupa", "Budhanilkantha Temple"],
      answer: 1,
      explanation: "Changu Narayan Temple is Nepal's oldest temple, with an inscription dating to 464 CE. The temple is dedicated to Vishnu and contains some of Nepal's finest ancient stone carvings.",
      points: 15
    },
    {
      id: 12,
      category: "geography",
      question: "Nepal is landlocked between which two countries?",
      options: ["India and Bhutan", "India and China", "China and Bangladesh", "India and Tibet"],
      answer: 1,
      explanation: "Nepal is bordered by India to the south, east, and west, and by China (Tibet Autonomous Region) to the north. Despite being landlocked, its position between these two giants gives it unique geopolitical significance.",
      points: 5
    },
    {
      id: 13,
      category: "culture",
      question: "What does 'Namaste' literally translate to?",
      options: ["Hello friend", "Peace be upon you", "I bow to the divine in you", "Welcome"],
      answer: 2,
      explanation: "'Namaste' (नमस्ते) combines 'namas' (bowing) and 'te' (you), literally meaning 'I bow to you'. It acknowledges the divine spirit within another person and is a universal greeting across Nepal and South Asia.",
      points: 10
    },
    {
      id: 14,
      category: "history",
      question: "In which year was Nepal unified under King Prithvi Narayan Shah?",
      options: ["1744 CE", "1768 CE", "1801 CE", "1816 CE"],
      answer: 1,
      explanation: "Prithvi Narayan Shah conquered the Kathmandu Valley in 1768 CE, unifying the many small kingdoms of Nepal into a single nation. He moved his capital from Gorkha to Kathmandu after the conquest.",
      points: 10
    },
    {
      id: 15,
      category: "religion",
      question: "The all-seeing Buddha eyes on Swayambhunath stupa represent what?",
      options: ["The four cardinal directions", "The wisdom that sees all of the universe", "The four stages of life", "The guardians of Buddhism"],
      answer: 1,
      explanation: "The eyes on Swayambhunath represent the wisdom and compassion of the Buddha, which sees in all directions. The symbol between the eyes is a curly Sanskrit 'ek' (one) representing unity of all things.",
      points: 10
    },
    {
      id: 16,
      category: "heritage",
      question: "Nyatapola temple in Bhaktapur has how many tiers?",
      options: ["3", "4", "5", "7"],
      answer: 2,
      explanation: "Nyatapola (meaning 'five storeys' in Newari) is a 5-tiered pagoda built in 1702 CE. At 30 metres, it is the tallest pagoda in Nepal. Each tier is guarded by pairs of mythological figures.",
      points: 10
    },
    {
      id: 17,
      category: "culture",
      question: "What is the traditional Newari script called?",
      options: ["Devanagari", "Pracalit (Ranjana)", "Brahmi", "Siddham"],
      answer: 1,
      explanation: "The Nepal Bhasa (Newari) language uses the Pracalit script, also known as Ranjana. This script was used for centuries in Nepal Bhasa literature and is still seen on temple inscriptions throughout the Kathmandu Valley.",
      points: 15
    },
    {
      id: 18,
      category: "geography",
      question: "Which river flows past Pashupatinath Temple?",
      options: ["Trishuli", "Bagmati", "Koshi", "Gandaki"],
      answer: 1,
      explanation: "The Bagmati River flows past Pashupatinath Temple. This sacred river is central to Hindu cremation rituals, and the cremation ghats (Arya Ghat) on its banks are among the holiest in the Hindu world.",
      points: 10
    },
    {
      id: 19,
      category: "history",
      question: "In which year did the devastating earthquake strike the Kathmandu Valley?",
      options: ["2011", "2013", "2015", "2017"],
      answer: 2,
      explanation: "The April 25, 2015 Gorkha earthquake (magnitude 7.8) killed nearly 9,000 people and damaged or destroyed many heritage structures including parts of Kathmandu Durbar Square. Reconstruction is still ongoing.",
      points: 5
    },
    {
      id: 20,
      category: "religion",
      question: "What is 'thangka' art?",
      options: [
        "Traditional Nepali dance",
        "Buddhist scroll painting depicting deities and mandalas",
        "A form of meditation",
        "Temple architecture style"
      ],
      answer: 1,
      explanation: "Thangka (टाँका) are traditional Buddhist scroll paintings, usually on cotton or silk. They depict deities, mandalas, and the life of the Buddha, and serve as visual aids for meditation. Patan is Nepal's center for thangka production.",
      points: 10
    }
  ]
};

// Shuffle utility
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

if (typeof module !== "undefined") module.exports = { QUIZ_DATA, shuffleArray };
