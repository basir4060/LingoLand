import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LevelPreview from './components/LevelPreview';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Adventures from './components/Adventures';

function App() {
  const [view, setView] = useState<'landing' | 'dashboard' | 'auth' | 'profile' | 'adventures'>('landing');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        setView('landing');
        setSession(null);
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setSession(session);
        // If it's an explicit sign-in event, go to profile
        if (event === 'SIGNED_IN') {
          setView('profile');
        }
        // For initial session check (page reload), we might want to stay on dashboard or landing? 
        // But for now, if we have a session and are just loading, let's default to dashboard if not already set?
        // Actually, let's simply rely on the 'SIGNED_IN' event for the redirect.
      } else if (session) {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStart = () => {
    if (session) {
      setView('dashboard');
    } else {
      setView('auth');
    }
    window.scrollTo(0, 0);
  };

  const handleHome = () => {
    setView('landing');
    window.scrollTo(0, 0);
  };

  const handleProfile = () => {
    setView('profile');
    window.scrollTo(0, 0);
  };

  const handleAdventures = () => {
    setView('adventures');
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setView('landing');
    window.scrollTo(0, 0);
  };

  return (
    <div className="appContainer">
      <Navbar
        onStart={handleStart}
        onHome={handleHome}
        onLogout={handleLogout}
        onProfile={handleProfile}
        onAdventures={handleAdventures}
        session={session}
      />
      <main>
        {view === 'landing' ? (
          <>
            <Hero onStart={handleStart} onAdventures={handleAdventures} session={session} />
            <LevelPreview />
            <Footer />
          </>
        ) : view === 'auth' ? (
          <div className="min-h-screen pt-32 flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
            <Auth />
          </div>
        ) : view === 'profile' ? (
          <Profile session={session} onLogout={handleLogout} />
        ) : view === 'adventures' ? (
          <Adventures onStart={handleStart} />
        ) : (
          <Dashboard />
        )}
      </main>
    </div>
  )
}

export default App
