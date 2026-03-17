import { useState } from 'react';
import { Header } from './components/Header';
import { OverviewPage } from './components/OverviewPage';
import { FileBrowser } from './components/FileBrowser';
import { SetupPage } from './components/SetupPage';

type Tab = 'overview' | 'files' | 'setup';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main>
        {activeTab === 'overview' && <OverviewPage />}
        {activeTab === 'files' && <FileBrowser />}
        {activeTab === 'setup' && <SetupPage />}
      </main>
    </div>
  );
}

export default App;
