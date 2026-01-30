import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import Lottie from 'lottie-react';

// Import Assets
import beeData from './assets/Flying Bee.json';

// --- Constants ---
// --- Constants ---
const GAME_SPEED = 3;
const GRAVITY = 0.4; // Very gentle gravity
const JUMP_STRENGTH = -6; // Gentle jump
const MAX_FALL_SPEED = 6; // Cap falling speed to match jump speed ("same pace")
const PIPE_SPACING = 300;
const PIPE_WIDTH = 60;
const BEE_SIZE = 40; // Hitbox size
const GAP_SIZE = 200; // Even wider gap for kids (Super Easy Mode)

interface Pipe {
    id: number;
    x: number;
    topHeight: number;
    passed: boolean;
}

interface FlappyBeeProps {
    onExit: () => void;
}

const FlappyBee: React.FC<FlappyBeeProps> = ({ onExit }) => {
    // Game State
    const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);

    // Physics State (Refs for performance)
    const beeY = useRef(250);
    const velocity = useRef(0);
    const pipes = useRef<Pipe[]>([]);
    const requestRef = useRef<number | null>(null);
    const lastTime = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Game Logic ---
    const spawnPipe = (startX: number) => {
        const minHeight = 100;
        const maxHeight = 300;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

        return {
            id: Date.now() + Math.random(),
            x: startX,
            topHeight,
            passed: false,
        };
    };

    const resetGame = () => {
        beeY.current = 250;
        velocity.current = 0;
        pipes.current = [spawnPipe(500), spawnPipe(800)]; // Start with 2 pipes
        setScore(0);
        setGameState('playing');
        lastTime.current = performance.now();
        loop();
    };

    const gameOver = () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        setGameState('gameover');
        if (score > highScore) setHighScore(score);
    };

    const loop = () => {
        if (gameState !== 'playing') return;

        // 1. Physics
        velocity.current += GRAVITY;
        // Clamp falling speed so it doesn't accelerate infinitely ("same pace" feel)
        if (velocity.current > MAX_FALL_SPEED) velocity.current = MAX_FALL_SPEED;

        beeY.current += velocity.current;

        // 2. Pipes Movement & Spawning
        pipes.current.forEach(pipe => {
            pipe.x -= GAME_SPEED;
        });

        // Remove off-screen pipes
        if (pipes.current.length > 0 && pipes.current[0].x < -PIPE_WIDTH) {
            pipes.current.shift();
        }

        // Add new pipes
        const lastPipe = pipes.current[pipes.current.length - 1];
        if (lastPipe && lastPipe.x < 500) { // Spawn when last pipe crosses threshold
            pipes.current.push(spawnPipe(lastPipe.x + PIPE_SPACING));
        }

        // 3. Collision Detection
        const containerHeight = containerRef.current?.clientHeight || 500;

        // Floor/Ceiling
        if (beeY.current > containerHeight - BEE_SIZE || beeY.current < 0) {
            gameOver();
            return;
        }

        // Pipes
        pipes.current.forEach(pipe => {
            // Horizontal Hit?
            // Bee Left < Pipe Right AND Bee Right > Pipe Left
            const beeLeft = 100; // Fixed horizontal pos
            const beeRight = 100 + BEE_SIZE;
            const pipeLeft = pipe.x;
            const pipeRight = pipe.x + PIPE_WIDTH;

            if (beeRight > pipeLeft && beeLeft < pipeRight) {
                // Vertical Hit?
                // Bee Top < Top Pipe Bottom OR Bee Bottom > Bottom Pipe Top
                const beeTop = beeY.current;
                const beeBottom = beeY.current + BEE_SIZE;

                const topPipeBottom = pipe.topHeight;
                const bottomPipeTop = pipe.topHeight + GAP_SIZE;

                if (beeTop < topPipeBottom || beeBottom > bottomPipeTop) {
                    gameOver();
                    return;
                }
            }

            // Scoring
            if (!pipe.passed && pipe.x + PIPE_WIDTH < 100) {
                pipe.passed = true;
                setScore(prev => prev + 1);
            }
        });

        // Loop
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(loop);
            // Force re-render not needed for every frame if we used canvas, 
            // but for DOM manipulation we need to rely on ref mutations and just trigger render on key events?
            // Actually, for React specific, let's force a render or use a simpler state approach for the visual loop
            // To make it smooth in React without canvas, we keep state separate and use a ref for the loop, 
            // but we need to update the DOM. 
            // Let's use a "tick" state to force update if we want exact sync, 
            // OR better: use refs for everything position-wise and update elements directly if needed, 
            // BUT for simplicity in this codebase, let's just allow React to re-render on the loop.
            // It might be slightly heavy but fine for a simple game.
            // Optimization: Update a dummy state to trigger render.
            setTick(prev => prev + 1);
        }
    };

    const [tick, setTick] = useState(0); // Dummy state to trigger renders

    useEffect(() => {
        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(loop);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [gameState, tick]); // Re-run loop when state updates? No, loop calls itself. 
    // Actually, the loop function creates closure. We need to be careful.
    // Standard pattern: useRef for the loop callback or just rely on the recursive call.
    // The recursive `loop` above captures the state properly if defined inside.

    // --- Controls ---
    const flap = () => {
        if (gameState === 'playing') {
            velocity.current = JUMP_STRENGTH;
        } else if (gameState === 'start' || gameState === 'gameover') {
            resetGame();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                flap();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState]);


    // --- Render ---
    return (
        <div className="flex flex-col items-center justify-center w-full min-h-[90vh] bg-sky-100 rounded-3xl overflow-hidden relative select-none shadow-[inset_0_0_100px_rgba(0,0,0,0.1)]">

            {/* HUD */}
            <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-[60] pointer-events-none">
                <button
                    onClick={onExit}
                    className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-white text-gray-700 transition-transform hover:scale-105 active:scale-95 pointer-events-auto"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="text-6xl font-black text-white font-heading drop-shadow-lg stroke-black">
                    {score}
                </div>
                {highScore > 0 && (
                    <div className="bg-white/50 px-4 py-2 rounded-full font-bold text-gray-700">
                        Top: {highScore}
                    </div>
                )}
            </div>

            {/* Game Container */}
            <div
                ref={containerRef}
                onClick={flap}
                className="relative w-full max-w-[95%] h-[500px] border-b-[12px] border-[#5D4037] bg-cyan-300 shadow-2xl overflow-hidden cursor-pointer rounded-3xl group"
            >
                {/* Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-300 to-blue-200">
                    {/* Clouds */}
                    <Cloud size={100} x="10%" y="10%" speed={20} />
                    <Cloud size={60} x="60%" y="30%" speed={35} />
                    <Cloud size={120} x="80%" y="15%" speed={25} />
                </div>

                {/* Pipes */}
                {pipes.current.map(pipe => (
                    <React.Fragment key={pipe.id}>
                        {/* Top Pipe */}
                        <div
                            className="absolute top-0 bg-green-500 border-x-4 border-b-4 border-green-700 rounded-b-xl"
                            style={{
                                left: pipe.x,
                                width: PIPE_WIDTH,
                                height: pipe.topHeight,
                                backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
                                backgroundSize: '20px 100%'
                            }}
                        >
                            {/* Cap */}
                            <div className="absolute bottom-0 left-[-4px] right-[-4px] h-6 bg-green-500 border-4 border-green-700 rounded-sm"></div>
                        </div>

                        {/* Bottom Pipe */}
                        <div
                            className="absolute bottom-0 bg-green-500 border-x-4 border-t-4 border-green-700 rounded-t-xl"
                            style={{
                                left: pipe.x,
                                width: PIPE_WIDTH,
                                height: (500 - pipe.topHeight - GAP_SIZE), // Total height - top - gap
                                backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(0,0,0,0.1) 50%)',
                                backgroundSize: '20px 100%'
                            }}
                        >
                            {/* Cap */}
                            <div className="absolute top-0 left-[-4px] right-[-4px] h-6 bg-green-500 border-4 border-green-700 rounded-sm"></div>
                        </div>
                    </React.Fragment>
                ))}

                {/* Character (Bee) */}
                <div
                    className="absolute left-[100px] z-20"
                    style={{
                        top: beeY.current,
                        width: BEE_SIZE,
                        height: BEE_SIZE,
                        // Rotation based on velocity
                        transform: `rotate(${Math.min(30, Math.max(-30, velocity.current * 3))}deg)`
                    }}
                >
                    <div className="w-[80px] h-[80px] -ml-[20px] -mt-[20px]">
                        <Lottie animationData={beeData} loop={true} />
                    </div>
                </div>

                {/* Ground Strip */}
                <div className="absolute bottom-0 w-full h-8 bg-[#81C784] border-t-4 border-[#4CAF50] z-30"></div>

                {/* Start Screen */}
                {gameState === 'start' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-40 text-white">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-7xl font-heading font-black drop-shadow-xl mb-4"
                        >
                            TAP TO FLY!
                        </motion.div>
                        <p className="text-xl font-bold opacity-90">Avoid the pipes!</p>
                    </div>
                )}

                {/* Game Over Screen */}
                {gameState === 'gameover' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white p-8 rounded-3xl shadow-2xl text-center border-8 border-orange-400"
                        >
                            <Trophy className="mx-auto text-yellow-400 mb-4" size={64} fill="currentColor" />
                            <h2 className="text-4xl font-black text-gray-800 mb-2 font-heading">Game Over!</h2>
                            <p className="text-2xl font-bold text-gray-500 mb-6">Score: <span className="text-orange-500">{score}</span></p>
                            <button
                                onClick={resetGame}
                                className="bg-gradient-to-r from-orange-400 to-orange-600 text-white font-black text-xl py-3 px-8 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                            >
                                <RotateCcw size={24} /> TRY AGAIN
                            </button>
                        </motion.div>
                    </div>
                )}
            </div>

            <div className="mt-4 text-center">
                <p className="text-gray-500 font-bold text-sm">Spacebar or Click to Fly</p>
            </div>
        </div>
    );
};

// Helper
const Cloud = ({ size, x, y, speed }: { size: number, x: string, y: string, speed: number }) => (
    <motion.div
        animate={{ x: [0, -100] }}
        transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
        className="absolute text-white/60"
        style={{ left: x, top: y }}
    >
        <svg width={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.5 12C3.567 12 2 13.567 2 15.5C2 17.433 3.567 19 5.5 19H18.5C20.985 19 23 16.985 23 14.5C23 12.015 20.985 10 18.5 10C18.36 10 18.221 10.009 18.085 10.026C17.65 6.643 14.757 4 11.25 4C7.355 4 4.197 7.155 4.197 11.05C4.197 11.385 4.223 11.713 4.273 12.033C4.652 12.011 5.064 12 5.5 12Z" />
        </svg>
    </motion.div>
);

export default FlappyBee;
