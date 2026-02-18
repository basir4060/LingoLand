import React from 'react';
import { motion } from 'framer-motion';
import { Star, Lock, Check } from 'lucide-react';

const levels = [
    { id: 1, name: "The Magical Forest", status: "completed", color: "bg-green-400" },
    { id: 2, name: "Crystal Caves", status: "unlocked", color: "bg-blue-400" },
    { id: 3, name: "Volcano Village", status: "locked", color: "bg-orange-400" },
    { id: 4, name: "Cloud Kingdom", status: "locked", color: "bg-sky-300" },
];

const LevelPreview: React.FC = () => {
    return (
        <section className="py-20 px-4 bg-white relative">
            {/* Decorative path line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-4 bg-gray-100 -translate-x-1/2 rounded-full hidden md:block border-dashed border-4 border-gray-200" />

            <div className="max-w-4xl mx-auto">
                <h2 className="text-center font-heading text-4xl font-bold text-gray-800 mb-16 relative z-10">
                    Your Adventure Map
                </h2>

                <div className="space-y-12 relative z-10">
                    {levels.map((level, index) => (
                        <motion.div
                            key={level.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col gap-8`}
                        >
                            {/* Level Node */}
                            <div className="flex-1 flex justify-center md:justify-end">
                                {index % 2 !== 0 && <div className="hidden md:block flex-1" />}
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`w-32 h-32 rounded-full border-8 border-white shadow-xl flex items-center justify-center cursor-pointer relative ${level.status === 'locked' ? 'bg-gray-200 grayscale' : level.color}`}
                                >
                                    {level.status === 'completed' && <Check size={40} className="text-white bg-green-500 rounded-full p-1 absolute -top-2 -right-2 border-4 border-white" />}
                                    {level.status === 'locked' && <Lock size={32} className="text-gray-400" />}
                                    {level.status === 'unlocked' && <Star size={40} className="text-yellow-300 fill-yellow-300 animate-pulse" />}
                                </motion.div>
                            </div>

                            {/* Text */}
                            <div className={`flex-1 text-center ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                                <h3 className="font-heading text-2xl font-bold text-gray-800">{level.name}</h3>
                                <p className="font-body text-gray-500 font-bold">World {level.id}</p>
                                {level.status === 'unlocked' && (
                                    <button className="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-[0_4px_0_rgb(109,40,217)] active:shadow-none active:translate-y-1">
                                        Continue Journey
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default LevelPreview;
