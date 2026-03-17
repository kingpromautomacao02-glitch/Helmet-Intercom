import { Cpu, Github, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'files' | 'setup';
  onTabChange: (tab: 'overview' | 'files' | 'setup') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm">Helmet Intercom</span>
              <span className="ml-2 text-xs text-slate-500">Android NDK</span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {(['overview', 'files', 'setup'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-1 rounded">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
