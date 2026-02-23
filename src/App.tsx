import { useState, useEffect } from "react";
import { PetProvider } from "./context/PetContext";
import { supabase } from "./lib/supabase";
import Auth from "./components/pages/Auth";
import Navbar from "./components/common/Navbar";
import Hero from "./components/pages/Hero";
import LevelPreview from "./components/pages/LevelPreview";
import Footer from "./components/common/Footer";
import Dashboard from "./components/pages/Dashboard";
import Profile from "./components/pages/Profile";
import Adventures from "./components/pages/Adventures";
import MiniGamesHub from "./components/minigames/MiniGamesHub";
import LanguagePicker from "./components/lessons/LanguagePicker";
import LessonPlayer from "./components/lessons/LessonPlayer";

function App() {
  const [view, setView] = useState<
    | "landing"
    | "dashboard"
    | "auth"
    | "profile"
    | "adventures"
    | "minigames"
    | "languagePicker"
    | "lessonPlayer"
  >("landing");
  const [selectedLang, setSelectedLang] = useState<"en" | "es" | "zh">("en");
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === "SIGNED_OUT") {
        setView("landing");
        setSession(null);
      } else if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        setSession(session);
        if (session) {
          setView((prev) => {
            // ONLY go to profile if we just clicked login from the auth screen
            if (event === "SIGNED_IN" && prev === "auth") {
              return "profile";
            }
            // On fresh page load, if session exists, go to dashboard
            if (prev === "landing") {
              return "dashboard";
            }
            // Otherwise, keep them where they are (lessonPlayer, minigames, etc)
            return prev;
          });
        }
      } else if (session) {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleStart = () => {
    if (session) {
      setView("dashboard");
    } else {
      setView("auth");
    }
    window.scrollTo(0, 0);
  };

  const handleHome = () => {
    setView("landing");
    window.scrollTo(0, 0);
  };

  const handleProfile = () => {
    setView("profile");
    window.scrollTo(0, 0);
  };

  const handleAdventures = () => {
    setView("adventures");
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setView("landing");
    window.scrollTo(0, 0);
  };

  return (
    <PetProvider>
      <div className="appContainer">
        {view !== "auth" && (
          <Navbar
            onStart={handleStart}
            onHome={handleHome}
            onProfile={handleProfile}
            onAdventures={handleAdventures}
            onLogout={handleLogout}
            session={session}
          />
        )}
        <main>
          {view === "landing" ? (
            <>
              <Hero
                onStart={handleStart}
                onAdventures={handleAdventures}
                session={session}
              />
              <LevelPreview />
              <Footer />
            </>
          ) : view === "auth" ? (
            <div className="min-h-screen pt-32 flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
              <Auth onBack={() => setView("landing")} />
            </div>
          ) : view === "profile" ? (
            <Profile session={session} onLogout={handleLogout} />
          ) : view === "adventures" ? (
            <Adventures onStart={handleStart} />
          ) : view === "minigames" ? (
            <MiniGamesHub onBack={() => setView("dashboard")} />
          ) : view === "languagePicker" ? (
            <LanguagePicker
              onSelect={(lang: "en" | "es" | "zh") => {
                setSelectedLang(lang);
                setView("lessonPlayer");
              }}
              onBack={() => setView("dashboard")}
            />
          ) : view === "lessonPlayer" ? (
            <LessonPlayer
              language={selectedLang}
              onExit={() => setView("dashboard")}
            />
          ) : (
            <Dashboard
              onMinigames={() => setView("minigames")}
              onLessons={() => setView("languagePicker")}
            />
          )}
        </main>
      </div>
    </PetProvider>
  );
}

export default App;
