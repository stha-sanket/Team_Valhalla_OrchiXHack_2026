import { useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    title: 'What we collect',
    body: 'Your account details (name and email), your trip progress — which checkpoints you have confirmed and which badges you have earned — and the destination you are currently navigating to.',
  },
  {
    title: 'Location',
    body: 'Your live GPS position is used only while a trip is active, to point the compass arrow and detect when you arrive at a checkpoint. It is streamed to our server for that purpose and is not stored or shared afterwards.',
  },
  {
    title: 'Camera',
    body: 'The camera feed powers the AR view on your device only. It is never recorded, stored, or sent anywhere.',
  },
  {
    title: 'How your data is used',
    body: 'We use your data solely to run the tour experience: tracking progress, awarding badges, and showing your trip history on the home screen. We do not sell or share your data with third parties.',
  },
  {
    title: 'Your choices',
    body: 'You can update your name and email from the profile page at any time. To delete your account and all associated progress, contact the team and we will remove it.',
  },
];

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      <header className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="shrink-0 w-10 h-10 rounded-full bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 text-stone-700 dark:text-stone-300 flex items-center justify-center active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Privacy policy</h1>
      </header>

      <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
        ARadhana is a guided AR tour app. Here is exactly what it does with your data — no legalese.
      </p>

      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <div
            key={s.title}
            className="bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 p-5"
          >
            <h2 className="text-sm font-bold text-stone-900 dark:text-white mb-1">{s.title}</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-stone-400 dark:text-stone-500 text-center mt-6">Last updated: July 2026</p>
    </div>
  );
};

export default PrivacyPolicyPage;
