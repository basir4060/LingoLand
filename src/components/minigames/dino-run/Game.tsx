import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import Lottie from 'lottie-react';

// Import Assets
import dinoData from './assets/Dinosaur Running.json';
import dogData from './assets/Long Dog.json';
import camelData from './assets/Baby Camel.json';
import elephantData from './assets/Walking Elephant.json';

// --- Types & Config ---
type CharacterId = 'dino' | 'dog' | 'camel' | 'elephant';

const CHARACTERS: CharacterConfig[] = [
    { id: 'dino', name: 'King Stompy Feet', data: dinoData, scale: 1.5, yOffset: -25, width: 100, flip: false },
    { id: 'dog', name: 'Duke of Zoomies', data: dogData, scale: 1.5, yOffset: -15, width: 110, flip: false },
    { id: 'camel', name: 'Prince Spits-a-Lot', data: camelData, scale: 1.4, yOffset: -5, width: 100, flip: true },
    { id: 'elephant', name: 'Empress Peanut', data: elephantData, scale: 1.4, yOffset: -25, width: 110, flip: false },
];

interface CharacterConfig {
    id: CharacterId;
    name: string;
    data: any;
    scale: number;
    yOffset: number; // To align shadow with ground
    width: number;   // Visual width
    flip: boolean;
}

interface DinoRunProps {
    onExit: () => void;
}

const DinoRun: React.FC<DinoRunProps> = ({ onExit }) => {
    // Game State
    const [gameState, setGameState] = useState<'select' | 'playing' | 'gameover'>('select');
    const [selectedChar, setSelectedChar] = useState<CharacterConfig>(CHARACTERS[0]);

    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isJumping, setIsJumping] = useState(false);

    // Difficulty
    const [gameSpeed, setGameSpeed] = useState(2.2); // Slower start (easier)

    const dinoRef = useRef<HTMLDivElement>(null);
    const obstacleRef = useRef<HTMLDivElement>(null);

    // --- Game Loop ---
    useEffect(() => {
        let collisionInterval: any;
        let scoreInterval: any;

        if (gameState === 'playing') {
            // Score
            scoreInterval = setInterval(() => {
                setScore((prev) => {
                    return prev + 1;
                });
            }, 200); // Slower scoring (5 points/sec) feels more meaningful
            // Collision
            collisionInterval = setInterval(() => {
                const dino = dinoRef.current;
                const obstacle = obstacleRef.current;

                if (dino && obstacle) {
                    const dinoRect = dino.getBoundingClientRect();
                    const obstacleRect = obstacle.getBoundingClientRect();

                    // Precise Hitbox (Visuals are decoupled now, so we can be precise)
                    const paddingX = 10;
                    const paddingY = 10;

                    if (
                        dinoRect.right > obstacleRect.left + paddingX &&
                        dinoRect.left < obstacleRect.right - paddingX &&
                        dinoRect.bottom > obstacleRect.top + paddingY
                    ) {
                        handleGameOver();
                    }
                }
            }, 20);
        }

        return () => {
            clearInterval(scoreInterval);
            clearInterval(collisionInterval);
        };
    }, [gameState]);

    // --- Controls ---
    const handleGameOver = () => {
        setGameState('gameover');
        if (score > highScore) setHighScore(score);
    };

    const jump = () => {
        if (!isJumping && gameState === 'playing') {
            setIsJumping(true);
            setTimeout(() => setIsJumping(false), 300);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (gameState === 'select') {
                    e.preventDefault();
                } else if (gameState === 'gameover') {
                    // Lock
                } else if (gameState === 'playing') {
                    e.preventDefault();
                    jump();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, isJumping]);

    const startGame = () => {
        setGameState('playing');
        setScore(0);
        setGameSpeed(2.2); // Reset to slow speed
        setIsJumping(false);
    };

    // --- Render Helpers ---

    // 1. Character Selection Screen
    if (gameState === 'select') {
        return (
            <div className="flex flex-col items-center justify-center w-full min-h-[85vh] bg-blue-50 rounded-3xl overflow-hidden relative select-none p-8">
                <div className="relative w-full max-w-6xl mb-10 px-4 flex items-center justify-center">
                    <button onClick={onExit} className="absolute left-6 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:bg-gray-50 text-gray-700 transition-all hover:scale-105 active:scale-95 z-50">
                        <ArrowLeft size={28} />
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h2 className="font-heading text-5xl font-black text-gray-800 mb-2 tracking-tight">Choose Your Runner!</h2>
                        <p className="text-gray-500 font-bold text-lg">Who will set the new high score?</p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl px-4">
                    {CHARACTERS.map((char) => (
                        <motion.div
                            key={char.id}
                            whileHover={{ scale: 1.05, y: -8 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: "spring" }}
                            onClick={() => {
                                setSelectedChar(char);
                                startGame();
                            }}
                            className="bg-white rounded-[2rem] p-6 shadow-xl border-4 border-transparent hover:border-purple-400 cursor-pointer flex flex-col items-center gap-6 group transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-gray-50 to-transparent -z-0"></div>

                            <div className="w-36 h-36 flex items-center justify-center relative z-10">
                                <div style={{
                                    width: char.width, // Use config width
                                    transform: char.flip ? 'scaleX(-1) scale(1.6)' : 'scale(1.6)'
                                }}>
                                    <Lottie animationData={char.data} loop={true} />
                                </div>
                            </div>

                            <div className="text-center z-10">
                                <h3 className="font-heading font-bold text-2xl text-gray-700 mb-2">{char.name}</h3>
                                <div className="bg-gray-100 text-gray-400 group-hover:bg-purple-500 group-hover:text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors uppercase tracking-wider">
                                    Select
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }

    // 2. Main Game Screen
    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[90vh] bg-sky-100 rounded-3xl overflow-hidden relative select-none shadow-[inset_0_0_100px_rgba(0,0,0,0.1)]">

            {/* Transition Overlay (Flash) */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 bg-white z-50 pointer-events-none"
            />

            {/* HUD */}
            <div className="absolute top-8 w-full max-w-[95%] left-1/2 -translate-x-1/2 flex justify-between items-start z-50 pointer-events-none">
                <button
                    onClick={() => setGameState('select')}
                    className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-white text-gray-700 transition-transform hover:scale-105 active:scale-95 pointer-events-auto"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col items-end">
                    <div className="text-5xl font-black text-gray-800 font-heading drop-shadow-md flex items-center gap-3">
                        <span className="text-3xl opacity-50">🏆</span> {score}
                    </div>
                    {highScore > 0 && <div className="text-sm font-bold text-gray-600 bg-white/50 px-3 py-1 rounded-full mt-2">HI: {highScore}</div>}
                </div>
            </div>

            {/* Game World Container */}
            <div
                className="relative w-full max-w-[95%] h-[500px] border-b-[12px] border-[#5D4037] bg-white shadow-2xl cursor-pointer rounded-3xl group"
                onClick={() => jump()}
            >
                {/* Parallax Background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] to-[#E0F7FA] overflow-hidden rounded-3xl">
                    {/* Sun */}
                    <div className="absolute top-10 right-20 w-16 h-16 bg-yellow-300 rounded-full blur-[2px] shadow-[0_0_40px_rgba(253,224,71,0.6)] animate-pulse"></div>

                    {/* Clouds Layer 1 (Slow) */}
                    <div className="absolute top-5 left-0 w-[200%] h-full animate-clouds opacity-80" style={{ animationDuration: '60s' }}>
                        <Cloud size={80} x="10%" />
                        <Cloud size={50} x="50%" />
                        <Cloud size={90} x="85%" />
                    </div>
                    {/* Clouds Layer 2 (Fast) */}
                    <div className="absolute top-20 left-0 w-[200%] h-full animate-clouds opacity-40" style={{ animationDuration: '30s' }}>
                        <Cloud size={40} x="20%" />
                        <Cloud size={60} x="60%" />
                    </div>

                    {/* Hills */}
                    <div className="absolute bottom-0 w-[200%] h-48 bg-[#aed581] opacity-80 rounded-t-[100px] animate-hills" style={{ animationDuration: '20s' }}></div>
                    <div className="absolute -bottom-10 w-[200%] h-40 bg-[#c5e1a5] opacity-90 rounded-t-[150px] animate-hills" style={{ animationDuration: '15s', animationDelay: '-5s' }}></div>
                </div>

                {/* Character HITBOX (Invisible Core) */}
                <div
                    ref={dinoRef}
                    className="absolute left-20 z-20 bg-red-500/0" // Debug: change opacity to see
                    style={{
                        bottom: isJumping ? '280px' : '0px',
                        transition: `bottom ${isJumping ? '300ms ease-out' : '300ms ease-in'}`,
                        width: '60px',  // Strict small width
                        height: '60px', // Strict small height (just the body/feet)
                    }}
                >
                    {/* Visual Overlay - Can be huge without affecting collision */}
                    <div style={{
                        position: 'absolute',
                        // Adjusted to -5 to keep feet on ground but not stick out too much
                        bottom: -5,
                        left: -40,   // Center visually
                        width: '180px',
                        transform: `translateY(${-selectedChar.yOffset}px) scale(1.5) ${selectedChar.flip ? 'scaleX(-1)' : 'none'}`,
                        pointerEvents: 'none' // visuals shouldn't trigger mouse events
                    }}>
                        <Lottie animationData={selectedChar.data} loop={gameState === 'playing'} />
                    </div>
                </div>

                {/* Obstacle HITBOX (Invisible Core) */}
                {gameState === 'playing' && (
                    <div
                        ref={obstacleRef}
                        className="absolute bottom-0 right-[-100px] w-12 h-16 z-20 flex items-end justify-center bg-blue-500/0"
                        style={{
                            animation: `moveObstacle ${gameSpeed}s linear infinite`
                        }}
                    >
                        {/* Visual Overlay - Can contain large text/emoji */}
                        <div className="absolute bottom-0 text-7xl filter drop-shadow-md transform -scale-x-100 leading-[0.8] origin-bottom">
                            🌵
                        </div>
                    </div>
                )}

                {/* Game Over Overlay */}
                {gameState === 'gameover' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-40">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border-8 border-yellow-300 max-w-md w-full relative"
                        >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-400 p-4 rounded-full shadow-lg border-4 border-white">
                                <Trophy className="text-white" size={48} />
                            </div>

                            <h2 className="text-5xl font-black text-gray-800 mt-8 mb-2 font-heading tracking-tight">Ouch!</h2>
                            <p className="text-2xl font-bold text-gray-400 mb-8">Score: <span className="text-purple-600 text-4xl">{score}</span></p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={startGame}
                                    className="w-full bg-gradient-to-r from-green-400 to-green-600 text-white font-heading font-black text-2xl py-4 px-8 rounded-2xl shadow-[0_6px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center gap-3"
                                >
                                    <RotateCcw size={28} strokeWidth={3} /> TRY AGAIN
                                </button>
                                <button
                                    onClick={() => setGameState('select')}
                                    className="mt-2 text-gray-400 font-bold hover:text-purple-500 transition-colors py-2"
                                >
                                    Pick New Character
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Ground & Instructions */}
            <div className="w-full max-w-[95%] mt-6 flex justify-between items-center bg-white/40 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/50">
                <div className="flex items-center gap-3">
                    <span className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 font-bold text-gray-600 text-xs tracking-wider">SPACE</span>
                    <span className="text-gray-600 font-bold">to Jump</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-green-700 font-bold text-sm tracking-wide">SPEED: {Math.max(1, Math.round((2.5 - gameSpeed) * 10))}x</span>
                </div>
            </div>

            <style>{`
                @keyframes moveObstacle {
                    0% { right: -100px; }
                    100% { right: 100%; }
                }
                @keyframes moveClouds {
                    from { transform: translateX(0); }
                    to { transform: translateX(-100%); }
                }
                .animate-clouds {
                    animation: moveClouds 20s linear infinite;
                }
                @keyframes moveHills {
                     from { transform: translateX(0); }
                     to { transform: translateX(-50%); }
                }
                .animate-hills {
                    animation: moveHills 20s linear infinite;
                }
            `}</style>
        </div>
    );
};

// --- Subcomponents ---


const Cloud = ({ size, x }: { size: number, x: string }) => (
    <div className="absolute text-white" style={{ left: x }}>
        <svg width={size} height={size * 0.6} viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.5 12C3.567 12 2 13.567 2 15.5C2 17.433 3.567 19 5.5 19H18.5C20.985 19 23 16.985 23 14.5C23 12.015 20.985 10 18.5 10C18.36 10 18.221 10.009 18.085 10.026C17.65 6.643 14.757 4 11.25 4C7.355 4 4.197 7.155 4.197 11.05C4.197 11.385 4.223 11.713 4.273 12.033C4.652 12.011 5.064 12 5.5 12Z" />
        </svg>
    </div>
);

export default DinoRun;
