/**
 * Yatri AR — Heritage Sites Database
 * Nepal's UNESCO World Heritage Sites and cultural landmarks
 */

const YATRI_SITES = [
  {
    id: "pashupatinath",
    name: "Pashupatinath Temple",
    nameNp: "पशुपतिनाथ मन्दिर",
    category: "temple",
    lat: 27.7105,
    lng: 85.3487,
    emoji: "🛕",
    unescoStatus: true,
    district: "Kathmandu",
    rating: 4.9,
    reviewCount: 12400,
    thumbnail: null, // will be generated
    description: "One of the most sacred Hindu temples in the world, dedicated to Lord Shiva. Set on the banks of the Bagmati River, this complex of temples, ashrams, and images has been a pilgrimage site for thousands of years.",
    history: "Built in the 5th century CE, the present pagoda was constructed in the 17th century by King Bhupatindra Malla after the original was destroyed by termites. The temple is managed by the Pashupati Area Development Trust.",
    legend: "Legend says that Shiva, disguised as a deer, hid in the forest on the banks of the Bagmati. The gods found him and brought him back to heaven, and where his horn fell became the Lingas of Pashupatinath.",
    tips: [
      "Non-Hindus may not enter the main temple, but can observe from the east bank",
      "Best visited at sunrise or during Maha Shivaratri festival",
      "Respectful dress required — cover shoulders and knees",
      "Allow 2–3 hours to explore the full complex"
    ],
    walkTime: 45, // min from Thamel
    tags: ["shiva", "pilgrimage", "river", "cremation ghats", "monkeys"]
  },
  {
    id: "swayambhunath",
    name: "Swayambhunath Stupa",
    nameNp: "स्वयम्भूनाथ",
    category: "stupa",
    lat: 27.7145,
    lng: 85.2904,
    emoji: "👁️",
    unescoStatus: true,
    district: "Kathmandu",
    rating: 4.8,
    reviewCount: 9800,
    thumbnail: null,
    description: "Known as the 'Monkey Temple', this ancient stupa sits atop a hill overlooking the Kathmandu Valley. The all-seeing Buddha eyes painted on the four sides of the tower are among Nepal's most recognizable symbols.",
    history: "The site dates back 2,500 years, making it one of the oldest religious sites in Nepal. The stupa itself was built around the 5th century CE. Legend says it self-arose (swayambhu means 'self-existing') from a lotus flower.",
    legend: "The Kathmandu Valley was once a lake, and a self-luminous jewel grew from a lotus in the water. The Bodhisattva Manjushri drained the lake by cutting the Chobar Gorge, and the jewel became the hill of Swayambhunath.",
    tips: [
      "Climb 365 steps to the stupa — rewarded with panoramic valley views",
      "Hundreds of rhesus monkeys inhabit the complex",
      "Buy a thangka painting or prayer flags from vendors near the top",
      "Best light for photos is early morning"
    ],
    walkTime: 30,
    tags: ["stupa", "monkey", "hilltop", "buddhist", "panorama", "prayer flags"]
  },
  {
    id: "boudhanath",
    name: "Boudhanath Stupa",
    nameNp: "बौद्धनाथ",
    category: "stupa",
    lat: 27.7215,
    lng: 85.3620,
    emoji: "☸️",
    unescoStatus: true,
    district: "Kathmandu",
    rating: 4.9,
    reviewCount: 14200,
    thumbnail: null,
    description: "One of the largest stupas in the world and the holiest Tibetan Buddhist temple outside Tibet. The stupa is a massive mandala representing the cosmos, and pilgrims walk the kora (circumambulation path) around it daily.",
    history: "Built in the 14th century after Timur sacked and burned the original stupa, Boudhanath became a major center of Tibetan Buddhism after the Tibetan diaspora following 1959. Over 50 Tibetan monasteries surround the stupa.",
    legend: "The stupa was built by a woman named Kangma, or 'Azima', who asked the king for land to build it. Given only as much land as a buffalo hide could cover, she cut the hide into thin strips and covered a vast area.",
    tips: [
      "Walk the kora clockwise — spin prayer wheels as you go",
      "The upper terrace offers a close-up view of the all-seeing eyes",
      "Visit at dusk when monks perform evening pujas",
      "Excellent Tibetan restaurants and thangka shops line the ring road"
    ],
    walkTime: 60,
    tags: ["stupa", "tibetan", "kora", "monks", "mandala", "nightlife"]
  },
  {
    id: "kathmandu-durbar",
    name: "Kathmandu Durbar Square",
    nameNp: "काठमाडौं दरबार क्षेत्र",
    category: "durbar",
    lat: 27.7044,
    lng: 85.3067,
    emoji: "🏛️",
    unescoStatus: true,
    district: "Kathmandu",
    rating: 4.7,
    reviewCount: 11000,
    thumbnail: null,
    description: "The historic royal palace square at the heart of old Kathmandu, featuring stunning Newari architecture, temples, and the kumari (living goddess) courtyard. This was the seat of the Malla kings who ruled the valley.",
    history: "The square developed from the 12th to 18th centuries under the Malla dynasty. The 2015 earthquake significantly damaged many structures, but restoration is ongoing. The square contains 50+ temples and monuments.",
    legend: "The living goddess Kumari — a young girl selected as the incarnation of the divine feminine — resides in the Kumari Ghar on the square. She occasionally appears at the window to bless visitors.",
    tips: [
      "Entrance fee for foreigners — worth it for access to the Kumari Ghar",
      "Hire a certified guide to understand the complex symbolism",
      "Visit Kasthamandap, the pavilion that gave Kathmandu its name",
      "Kal Bhairav statue is the most sacred object on the square"
    ],
    walkTime: 20,
    tags: ["palace", "newari", "kumari", "malla", "architecture", "earthquake"]
  },
  {
    id: "patan-durbar",
    name: "Patan Durbar Square",
    nameNp: "पाटन दरबार क्षेत्र",
    category: "durbar",
    lat: 27.6710,
    lng: 85.3243,
    emoji: "🏯",
    unescoStatus: true,
    district: "Lalitpur",
    rating: 4.8,
    reviewCount: 8900,
    thumbnail: null,
    description: "Considered the finest example of Newari architecture in Nepal, Patan's royal square features the Krishna Mandir temple — entirely built from stone — and dozens of other temples, fountains, and courtyards.",
    history: "Patan (ancient name: Lalitpur, 'city of beauty') is one of the oldest Buddhist cities in the world. The square reached its artistic peak under the Malla kings in the 17th century. The Patan Museum within the palace is world-class.",
    legend: "Krishna is said to have appeared to King Siddhi Narasimha Malla in a dream, prompting him to build the Krishna Mandir in stone (uniquely unusual for Nepal). Each pillar depicts a scene from the Mahabharata or Ramayana.",
    tips: [
      "The Patan Museum inside the palace is one of South Asia's best",
      "Traditional Newari metalwork — repousse, lost-wax casting — sold nearby",
      "Mul Chowk courtyard is the most sacred — remove shoes",
      "The square is less crowded than Kathmandu Durbar Square"
    ],
    walkTime: 35,
    tags: ["stone temple", "patan", "krishna", "museum", "metalwork", "peaceful"]
  },
  {
    id: "bhaktapur-durbar",
    name: "Bhaktapur Durbar Square",
    nameNp: "भक्तपुर दरबार क्षेत्र",
    category: "durbar",
    lat: 27.6720,
    lng: 85.4279,
    emoji: "🗼",
    unescoStatus: true,
    district: "Bhaktapur",
    rating: 4.9,
    reviewCount: 10200,
    thumbnail: null,
    description: "The best-preserved medieval town in Nepal, Bhaktapur feels like stepping back 500 years. The durbar square features the 55-window palace, Vatsala temple, and Nyatapola — Nepal's tallest pagoda.",
    history: "Bhaktapur was the capital of the Malla kingdom before the valley was split into three kingdoms in 1482. The German development program helped restore the city after the 1934 earthquake, preserving its medieval character.",
    legend: "Nyatapola temple's five-tiered pagoda is guarded by pairs of warriors, elephants, lions, griffins, and goddesses on each terrace. The goddess Siddhi Lakshmi inside is so powerful that even her name is kept secret.",
    tips: [
      "Buy juju dhau (king yogurt) in clay pots — a Bhaktapur specialty",
      "Nyatapola temple's 5 stories represent the 5 elements",
      "Pottery Square is where traditional potters still work with clay",
      "Allow a full day — Bhaktapur rewards slow exploration"
    ],
    walkTime: 90, // from Kathmandu
    tags: ["medieval", "pagoda", "pottery", "yogurt", "5-tiered", "preserved"]
  },
  {
    id: "changu-narayan",
    name: "Changu Narayan Temple",
    nameNp: "चाँगुनारायण मन्दिर",
    category: "temple",
    lat: 27.7157,
    lng: 85.4162,
    emoji: "🌿",
    unescoStatus: true,
    district: "Bhaktapur",
    rating: 4.6,
    reviewCount: 3200,
    thumbnail: null,
    description: "Nepal's oldest Hindu temple, dedicated to Vishnu, sits on a forested hilltop with sweeping views of the Himalayan range. The temple is a treasury of ancient stone sculptures, some dating back to the 4th century.",
    history: "First mentioned in an inscription from 464 CE, Changu Narayan is Nepal's oldest temple. The current structure dates to the 17th century after fire destroyed the original. Its courtyard contains some of Nepal's finest ancient stone carvings.",
    legend: "A cowherd discovered that his cow was pouring milk over a spot in the forest. When the tree at that spot was cut, blood flowed — revealing a hidden image of Vishnu, thus establishing the temple.",
    tips: [
      "Combine with a visit to Bhaktapur — they share a district",
      "The hilltop location gives one of the best Himalayan views in the valley",
      "Look for the 5th century stone carving of Vishnu Vikrantha",
      "A small museum at the site explains the sculptures"
    ],
    walkTime: 120, // from Kathmandu by taxi
    tags: ["vishnu", "hilltop", "oldest", "sculpture", "himalaya", "forest"]
  },
  {
    id: "lumbini",
    name: "Lumbini — Birthplace of Buddha",
    nameNp: "लुम्बिनी",
    category: "natural",
    lat: 27.4833,
    lng: 83.2769,
    emoji: "🌸",
    unescoStatus: true,
    district: "Rupandehi",
    rating: 4.8,
    reviewCount: 7600,
    thumbnail: null,
    description: "The birthplace of Siddhartha Gautama (the Buddha) in 623 BCE, Lumbini is one of the most sacred places in Buddhism. The sacred garden contains the Maya Devi Temple, Ashoka Pillar, and dozens of international Buddhist monasteries.",
    history: "Emperor Ashoka visited Lumbini in 249 BCE and erected a pillar marking the birthplace. The site was lost to history until rediscovered by Alois Anton Fuehrer in 1895. UNESCO has helped develop the Lumbini Master Plan.",
    legend: "Queen Maya Devi, traveling to her mother's home for childbirth, stopped in Lumbini Garden. While holding a tree branch, the future Buddha emerged from her right side, took seven steps, and declared he would be reborn no more.",
    tips: [
      "The sacred garden (Maya Devi Temple area) requires removal of shoes",
      "Rent a bicycle to explore the vast monastic zone",
      "Visit the World Peace Flame at the center of the monastic zone",
      "Best visited early morning for peace and cool temperatures"
    ],
    walkTime: 480, // 8 hour drive from Kathmandu
    tags: ["buddha", "pilgrimage", "ashoka", "peace", "monastery", "sacred"]
  }
];

// Category metadata
const YATRI_CATEGORIES = {
  all:     { label: "All Sites", emoji: "🌏" },
  temple:  { label: "Temples",   emoji: "🛕" },
  stupa:   { label: "Stupas",    emoji: "☸️"  },
  durbar:  { label: "Durbars",   emoji: "🏛️" },
  natural: { label: "Natural",   emoji: "🌸"  }
};

// Export for use in other modules
if (typeof module !== "undefined") module.exports = { YATRI_SITES, YATRI_CATEGORIES };
