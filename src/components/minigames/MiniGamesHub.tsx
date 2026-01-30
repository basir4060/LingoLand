import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, ArrowLeft, Lock } from 'lucide-react';
import DinoRun from './dino-run/Game';
import FlappyBee from './flappy-bee/Game';

interface MiniGamesHubProps {
    onBack: () => void;
}

type GameType = 'dino' | 'bee' | 'memory' | 'puzzle' | null;

const MiniGamesHub: React.FC<MiniGamesHubProps> = ({ onBack }) => {
    const [activeGame, setActiveGame] = useState<GameType>(null);

    const games = [
        {
            id: 'dino',
            name: 'Dino Run',
            description: 'Run and jump over obstacles!',
            color: 'bg-green-100',
            icon: '🦖',
            locked: false
        },
        {
            id: 'bee', // NEW GAME
            name: 'Flappy Bee',
            description: 'Buzz through the honey pipes!',
            color: 'bg-yellow-100',
            icon: '🐝',
            locked: false
        },
        {
            id: 'memory',
            name: 'Memory Match',
            description: 'Find matching pairs of cards.',
            color: 'bg-blue-100',
            icon: '🎴',
            locked: true
        },
        {
            id: 'puzzle',
            name: 'Word Puzzle',
            description: 'Find the hidden words.',
            color: 'bg-purple-100',
            icon: '🧩',
            locked: true
        },
        {
            id: 'drawing',
            name: 'Magic Paint',
            description: 'Draw your own masterpiece.',
            color: 'bg-pink-100',
            icon: '🎨',
            locked: true
        },
    ];

    if (activeGame === 'dino') {
        return <DinoRun onExit={() => setActiveGame(null)} />;
    }

    if (activeGame === 'bee') {
        return <FlappyBee onExit={() => setActiveGame(null)} />;
    }

    // Add more game conditionals here as we build them

    return (
        <div className="min-h-screen pt-36 px-4 pb-12 bg-[#F0F4F8] flex flex-col items-center">

            {/* Header */}
            <div className="w-full max-w-4xl flex items-center mb-8 relative">
                <button
                    onClick={onBack}
                    className="absolute left-0 p-3 rounded-full bg-white shadow-md hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="w-full text-center">
                    <h1 className="font-heading font-black text-4xl text-gray-800 flex items-center justify-center gap-3">
                        <Gamepad2 className="text-purple-500" size={40} />
                        Game Arcade
                    </h1>
                    <p className="text-gray-500 font-bold mt-2">Play fun games and earn points!</p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                {games.map((game, index) => (
                    <motion.div
                        key={game.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.03, rotate: 1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !game.locked && setActiveGame(game.id as GameType)}
                        className={`
                    relative p-6 rounded-[2rem] shadow-lg border-4 border-white cursor-pointer overflow-hidden
                    ${game.locked ? 'opacity-80 grayscale-[0.5]' : 'hover:shadow-2xl'}
                    ${game.color}
                `}
                    >
                        {/* Lock Overlay */}
                        {game.locked && (
                            <div className="absolute top-4 right-4 bg-black/10 p-2 rounded-full">
                                <Lock size={20} className="text-gray-500" />
                            </div>
                        )}

                        <div className="text-6xl mb-4 bg-white w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm">
                            {game.icon}
                        </div>

                        <h3 className="font-heading font-bold text-2xl text-gray-800 mb-2">
                            {game.name}
                        </h3>
                        <p className="text-gray-600 font-medium leading-tight">
                            {game.description}
                        </p>

                        {!game.locked && (
                            <div className="mt-4 inline-block bg-white text-gray-800 font-bold px-4 py-2 rounded-xl text-sm shadow-sm group-hover:scale-105 transition-transform">
                                Play Now
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MiniGamesHub;
