import { useState } from 'react';
import { PetProvider } from './context/PetContext';
import Navbar from './components/common/Navbar';
import Hero from './components/pages/Hero';
import LevelPreview from './components/pages/LevelPreview';
import Footer from './components/common/Footer';
import Dashboard from './components/pages/Dashboard';

function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('dashboard');

  const handleStart = () => { setView('dashboard'); window.scrollTo(0, 0); };
  const handleHome = () => { setView('landing'); window.scrollTo(0, 0); };

  return (
    <PetProvider>
      <div className="appContainer">
        <Navbar
          onStart={handleStart}
          onHome={handleHome}
          onLogout={() => {}}
          onProfile={() => {}}
          onAdventures={() => {}}
          session={null}
        />
        <main>
          {view === 'landing' ? (
            <>
              <Hero onStart={handleStart} onAdventures={() => {}} session={null} />
              <LevelPreview />
              <Footer />
            </>
          ) : (
            <Dashboard />
          )}
        </main>
      </div>
    </PetProvider>
  );
}

export default App;
