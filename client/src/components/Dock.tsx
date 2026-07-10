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
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/85 dark:bg-black/75 backdrop-blur-2xl border-t border-stone-200/70 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto flex">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            aria-label={item.label}
            className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 pt-2 pb-2.5 active:scale-95 transition-transform disabled:opacity-30 disabled:pointer-events-none ${
              item.active
                ? 'text-crimson-500 dark:text-crimson-400'
                : 'text-stone-400 dark:text-stone-500'
            }`}
          >
            <span
              className={`flex items-center justify-center w-12 h-7 rounded-full transition-colors ${
                item.active ? 'bg-crimson-50 dark:bg-crimson-500/15' : ''
              }`}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-medium truncate max-w-full px-1">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Dock;
