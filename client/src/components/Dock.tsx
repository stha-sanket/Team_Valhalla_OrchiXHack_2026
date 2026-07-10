import type { ReactNode } from 'react';

export interface DockItem {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const Dock = ({ items }: { items: DockItem[] }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-end gap-1.5 bg-white/70 dark:bg-black/60 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] px-2.5 py-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            aria-label={item.label}
            className={`group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 hover:-translate-y-2 hover:scale-110 disabled:opacity-30 disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:scale-100 ${
              item.active
                ? 'bg-highlight1 text-white shadow-lg shadow-highlight1/30'
                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/10'
            }`}
          >
            {item.icon}
            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 dark:bg-white px-2 py-1 text-xs font-medium text-white dark:text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dock;
