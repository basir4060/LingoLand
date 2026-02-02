import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gamepad2, Star, Sparkles, Flame, Target, Zap, Crown, Moon, Sun } from 'lucide-react';
import TurtlePet from '../pet/TurtlePet';
import { usePet } from '../../context/PetContext';

const Dashboard: React.FC = () => {
    const { mood, message, celebrate, encourage, greet, sleep, wake, setMood } = usePet();
    const [pose, setPose] = useState<'front' | 'meditate'>('front');

    const handleFeed = () => celebrate();
    const handlePlay = () => encourage();
    const handlePetClick = () => greet();
    
    const handleRest = () => {
        if (pose === 'meditate') {
            // Wake up
            setPose('front');
            wake();
        } else {
            // Go to sleep/meditate
            setPose('meditate');
            sleep();
        }
    };

    return (
        <div className="min-h-screen pt-36 pb-12 px-4 bg-[#F0F4F8] relative overflow-hidden font-body">
            {/* Background */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-teal-100 to-transparent -z-10"></div>
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-cyan-200/40 rounded-full blur-3xl -z-10"></div>
            <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-teal-200/40 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] min-h-[750px]">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex-1 flex flex-col gap-4">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50">
                            <h2 className="font-heading text-2xl text-gray-800 font-bold flex items-center gap-3">
                                <span className="bg-teal-100 p-2 rounded-xl text-teal-600"><Zap size={20} className="fill-teal-600" /></span>
                                Play Zone
                            </h2>
                            <p className="text-gray-500 text-sm mt-1 ml-1">Ready for a challenge?</p>
                        </div>

                        <div className="flex-1 flex flex-col gap-4">
                            <motion.button whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-500 rounded-[2rem] p-6 text-white text-left shadow-lg shadow-teal-200 group flex-1">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Calendar size={120} /></div>
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center mb-auto shadow-inner border border-white/10"><Calendar size={28} /></div>
                                    <div className="mt-8">
                                        <h3 className="font-heading font-black text-2xl mb-1">Daily Quiz</h3>
                                        <p className="text-teal-100 font-medium">Earn double XP today!</p>
                                        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm"><span>Starts in 2h</span></div>
                                    </div>
                                </div>
                            </motion.button>

                            <motion.button whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }} className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-green-500 rounded-[2rem] p-6 text-white text-left shadow-lg shadow-emerald-200 group flex-1">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500"><Gamepad2 size={120} /></div>
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="bg-white/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center mb-auto shadow-inner border border-white/10"><Gamepad2 size={28} /></div>
                                    <div className="mt-8">
                                        <h3 className="font-heading font-black text-2xl mb-1">Mini Games</h3>
                                        <p className="text-emerald-100 font-medium">Explore 12 new levels</p>
                                        <div className="mt-4 w-full bg-black/10 rounded-full h-1.5 overflow-hidden"><div className="bg-white w-[60%] h-full rounded-full"></div></div>
                                    </div>
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>
                </div>

                {/* MIDDLE COLUMN - TURTLE PET */}
                <div className="lg:col-span-6 relative flex flex-col">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="flex-1 bg-white rounded-[3rem] border-8 border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-50 to-white"></div>
                        <div className="absolute top-[-50%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(45,212,191,0.1)_0%,transparent_60%)]"></div>
                        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-teal-100 to-transparent opacity-30 rounded-b-[2.5rem]"></div>

                        {/* THE TURTLE PET */}
                        <div className="relative z-10 w-full h-[90%] p-8 flex items-center justify-center">
                            <TurtlePet
                                mood={mood}
                                pose={pose}
                                message={message}
                                showMessage={!!message}
                                size="large"
                                onPetClick={handlePetClick}
                            />
                        </div>

                        {/* Mood indicator */}
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} className="absolute top-8 right-8 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
                            <div className="bg-teal-400 p-2 rounded-full text-white"><Sparkles size={16} /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase">Mood</p>
                                <p className="font-heading font-bold text-gray-700 capitalize">{mood}</p>
                            </div>
                        </motion.div>

                        {/* Action buttons */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                            <button onClick={handleFeed} className="bg-white px-5 py-3 rounded-full shadow-lg border-2 border-transparent hover:border-teal-200 font-bold text-gray-600 hover:text-teal-500 transition-all flex items-center gap-2">🥬 Feed</button>
                            <button onClick={handlePlay} className="bg-white px-5 py-3 rounded-full shadow-lg border-2 border-transparent hover:border-cyan-200 font-bold text-gray-600 hover:text-cyan-500 transition-all flex items-center gap-2">🎾 Play</button>
                            <button 
                                onClick={handleRest} 
                                className={`px-5 py-3 rounded-full shadow-lg border-2 border-transparent font-bold transition-all flex items-center gap-2 ${
                                    pose === 'meditate' 
                                        ? 'bg-amber-100 text-amber-600 hover:border-amber-200' 
                                        : 'bg-white text-gray-600 hover:border-indigo-200 hover:text-indigo-500'
                                }`}
                            >
                                {pose === 'meditate' ? <><Sun size={18} /> Wake</> : <><Moon size={18} /> Rest</>}
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex-1 flex flex-col gap-4">
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50">
                            <h2 className="font-heading text-2xl text-gray-800 font-bold flex items-center gap-3">
                                <span className="bg-yellow-100 p-2 rounded-xl text-yellow-600"><Crown size={20} className="fill-yellow-600" /></span>
                                Progress
                            </h2>
                        </div>

                        <div className="flex-1 bg-white rounded-[2.5rem] p-6 shadow-xl border-2 border-gray-50 flex flex-col gap-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full blur-2xl -mr-10 -mt-10"></div>

                            <div className="relative z-10 bg-[#F9F9F9] p-5 rounded-3xl border border-gray-100 group hover:border-yellow-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-yellow-400 p-2.5 rounded-xl text-white shadow-lg shadow-yellow-200"><Star size={20} className="fill-white" /></div>
                                    <span className="text-gray-300 font-bold text-xs bg-gray-100 px-2 py-1 rounded-lg">Lvl 5</span>
                                </div>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Total Stars</p>
                                <p className="font-heading font-black text-4xl text-gray-800 tracking-tight">1,240</p>
                            </div>

                            <div className="relative z-10 bg-[#F9F9F9] p-5 rounded-3xl border border-gray-100 group hover:border-orange-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-200"><Flame size={20} className="fill-white" /></div>
                                </div>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-1">Day Streak</p>
                                <p className="font-heading font-black text-4xl text-gray-800 tracking-tight">12 <span className="text-sm text-gray-400 font-medium">days</span></p>
                            </div>

                            <div className="mt-auto relative z-10">
                                <div className="flex justify-between items-end mb-3">
                                    <p className="font-bold text-gray-800 flex items-center gap-2"><Target size={18} className="text-teal-500" /> Weekly Goal</p>
                                    <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md text-sm">75%</span>
                                </div>
                                <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden border border-gray-100 p-0.5">
                                    <div className="bg-gradient-to-r from-teal-400 to-cyan-500 h-full w-[75%] rounded-full shadow-sm relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
