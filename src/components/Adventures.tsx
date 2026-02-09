import React from 'react';
import { motion } from 'framer-motion';
import { Map, Star, Lock, ArrowRight, Globe, Zap, Crown, Sparkles } from 'lucide-react';

interface AdventuresProps {
    onStart: () => void;
}

const Adventures: React.FC<AdventuresProps> = ({ onStart }) => {
    const adventures = [
        {
            id: 'spanish-temple',
            title: 'The Lost Temple',
            language: 'Spanish',
            level: 1,
            description: 'Explore ancient ruins and learn Spanish basics in this jungle adventure.',
            color: 'from-orange-400 to-red-500',
            icon: Map,
            locked: false,
        },
        {
            id: 'neon-city',
            title: 'Neon Tokyo',
            language: 'Japanese',
            level: 5,
            description: 'Navigate the cyberpunk streets of future Tokyo while mastering Kanji.',
            color: 'from-purple-400 to-pink-500',
            icon: Zap,
            locked: true,
        },
        {
            id: 'french-cafe',
            title: 'Midnight Café',
            language: 'French',
            level: 3,
            description: 'Romance, mystery, and croissants await in the heart of Paris.',
            color: 'from-blue-400 to-indigo-500',
            icon: Globe,
            locked: true,
        },
        {
            id: 'german-castle',
            title: 'Iron Fortress',
            language: 'German',
            level: 10,
            description: 'Conquer the castle of grammar and defeat the dragons of conjugation.',
            color: 'from-slate-600 to-slate-800',
            icon: Crown,
            locked: true,
        },
        {
            id: 'italian-coast',
            title: 'Amalfi Racer',
            language: 'Italian',
            level: 7,
            description: 'Speed through the coastal roads learning Italian phrases.',
            color: 'from-emerald-400 to-teal-600',
            icon: Sparkles,
            locked: true,
        },
        {
            id: 'korean-pop',
            title: 'K-Pop Star',
            language: 'Korean',
            level: 4,
            description: 'Rise to fame in Seoul by mastering the language of music.',
            color: 'from-pink-400 to-rose-500',
            icon: Star,
            locked: true,
        },
    ];

    return (
        <div className="min-h-screen pt-32 px-4 pb-20 bg-[#F0F4F8]">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block mb-4 px-4 py-1 bg-white rounded-full shadow-sm text-primary font-bold text-sm uppercase tracking-wide"
                    >
                        World Map
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="font-heading font-black text-4xl md:text-5xl text-gray-800 mb-6"
                    >
                        Choose Your Adventure
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-600 max-w-2xl mx-auto"
                    >
                        Embark on magical journeys to master new languages. Pick a world and start your quest today!
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {adventures.map((adventure, index) => (
                        <motion.div
                            key={adventure.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.1 }}
                            className={`relative group bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border border-transparent hover:border-${adventure.color.split('-')[1]}-200 ${adventure.locked ? 'opacity-80 grayscale-[0.8] hover:grayscale-[0.5]' : ''
                                }`}
                        >
                            {/* Card Header/Image Area */}
                            <div className={`h-40 bg-gradient-to-br ${adventure.color} p-6 relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-700" />
                                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

                                <div className="relative z-10 flex justify-between items-start">
                                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl text-white shadow-inner">
                                        <adventure.icon size={32} />
                                    </div>
                                    {adventure.locked ? (
                                        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white flex items-center gap-1 text-xs font-bold shadow-sm">
                                            <Lock size={12} />
                                            <span>Lvl {adventure.level}</span>
                                        </div>
                                    ) : (
                                        <div className="bg-white/30 backdrop-blur-md px-3 py-1 rounded-full text-white flex items-center gap-1 text-xs font-bold shadow-sm animate-pulse">
                                            <Star size={12} className="fill-current" />
                                            <span>Open</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-3">
                                    <span className={`text-xs font-extrabold tracking-widest uppercase py-1 px-2 rounded-md bg-gray-100 text-gray-500`}>
                                        {adventure.language}
                                    </span>
                                </div>
                                <h3 className="font-heading font-bold text-2xl text-gray-800 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-800 group-hover:to-gray-600 transition-all">
                                    {adventure.title}
                                </h3>
                                <p className="text-gray-500 font-medium mb-8 line-clamp-2 text-sm leading-relaxed">
                                    {adventure.description}
                                </p>

                                <button
                                    onClick={adventure.locked ? undefined : onStart}
                                    disabled={adventure.locked}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${adventure.locked
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-900 text-white shadow-lg lg:shadow-gray-900/20 hover:bg-primary hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]'
                                        }`}
                                >
                                    {adventure.locked ? (
                                        <span className="flex items-center gap-2">
                                            <Lock size={16} /> Locked
                                        </span>
                                    ) : (
                                        <>
                                            <span>Start Journey</span>
                                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Adventures;
