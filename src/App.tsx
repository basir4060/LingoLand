import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LevelPreview from './components/LevelPreview';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');

  const handleStart = () => {
    setView('dashboard');
    window.scrollTo(0, 0);
  };

  const handleHome = () => {
    setView('landing');
    window.scrollTo(0, 0);
  };
  return (
    <div className="min-h-screen bg-background font-body selection:bg-purple-200">
      <Navbar onStart={handleStart} onHome={handleHome} />
      <main>
        {view === 'landing' ? (
          <>
            <Hero onStart={handleStart} />
            <LevelPreview />
            <Footer />
          </>
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  )
}

export default App
