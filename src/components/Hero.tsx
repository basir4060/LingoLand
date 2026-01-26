import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star } from 'lucide-react';
import PetDisplay from './PetDisplay';

interface HeroProps {
    onStart: () => void;
    onAdventures: () => void;
    session: any;
}

const Hero: React.FC<HeroProps> = ({ onStart, onAdventures, session }) => {
    // const [showToast, setShowToast] = React.useState(false);

    const handleSignUp = () => {
        if (session) {
            onAdventures();
        } else {
            onStart();
        }
    };

    return (
        <section className="min-h-screen pt-32 pb-20 px-4 relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">

            {/* Custom Notification Toast - Removed for Auth Flow */}

            {/* Background Decor */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
            <div className="absolute top-40 right-10 w-32 h-32 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-32 h-32 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">

                {/* Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center md:text-left"
                >
                    <div className="inline-flex items-center gap-2 bg-white border-2 border-primary/20 px-4 py-1.5 rounded-full mb-6 shadow-sm">
                        <Star className="text-yellow-400 fill-yellow-400" size={16} />
                        <span className="font-bold text-sm text-primary uppercase tracking-wide">Fun for ages 3-10</span>
                    </div>

                    <h1 className="font-heading text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
                        Learn Languages on a <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">Magical Adventure!</span>
                    </h1>

                    <p className="font-body text-xl text-gray-600 mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
                        Join 10,000+ kids exploring new worlds, playing, and speaking new languages with confidence.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSignUp}
                            className="flex items-center justify-center gap-3 bg-secondary text-white font-heading font-bold text-xl px-8 py-4 rounded-2xl shadow-[0_6px_0_rgb(5,150,105)] active:shadow-none active:translate-y-1.5 transition-all"
                        >
                            {session ? 'Explore other adventures' : 'Sign Up'}
                        </motion.button>

                        <button className="flex items-center justify-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors px-6 py-4">
                            <BookOpen size={20} />
                            See How It Works
                        </button>
                    </div>
                </motion.div>

                {/* Hero Image / Interaction */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="relative flex justify-center items-center"
                >
                    {/* Main Content */}
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="relative z-20 w-full max-w-[750px] aspect-square flex items-center justify-center"
                    >
                        {/* Pet Animation Display */}
                        <div className="w-full h-full">
                            <PetDisplay />
                        </div>
                    </motion.div>

                    {/* Blob Behind */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10"></div>
                </motion.div>

            </div>
        </section>
    );
};

export default Hero;
