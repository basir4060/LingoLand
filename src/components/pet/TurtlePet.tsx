import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PetSpeechBubble from './PetSpeechBubble';

// Import turtle images
import turtleFront from '../../assets/turtle/turtle-front.png';
import turtleMeditate from '../../assets/turtle/turtle-meditate.png';
import turtleRunRight from '../../assets/turtle/turtle-run-right.png';

export type TurtlePose = 'front' | 'meditate' | 'run-right' | 'run-left';
export type TurtleMood = 'idle' | 'happy' | 'excited' | 'thinking' | 'sleeping' | 'celebrating';

interface TurtlePetProps {
    mood?: TurtleMood;
    pose?: TurtlePose;
    message?: string | null;
    onPetClick?: () => void;
    showMessage?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const TurtlePet: React.FC<TurtlePetProps> = ({
    mood = 'idle',
    pose = 'front',
    message = null,
    onPetClick,
    showMessage = false,
    size = 'large',
    className = '',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0.5, y: 0.5 });
    const [isHovered, setIsHovered] = useState(false);
    const [currentMessage, setCurrentMessage] = useState<string | null>(null);

    const sizeClasses = {
        small: 'w-32 h-32',
        medium: 'w-48 h-48',
        large: 'w-full h-full max-w-md max-h-md',
    };

    // Get the correct image based on pose
    const getImage = () => {
        switch (pose) {
            case 'meditate':
                return turtleMeditate;
            case 'run-right':
            case 'run-left':
                return turtleRunRight;
            case 'front':
            default:
                return turtleFront;
        }
    };

    // Get animation based on mood
    const getMoodAnimation = () => {
        switch (mood) {
            case 'excited':
            case 'celebrating':
                return {
                    animate: { y: [0, -20, 0], rotate: [0, -5, 5, 0] },
                    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }
                };
            case 'happy':
                return {
                    animate: { y: [0, -10, 0] },
                    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                };
            case 'thinking':
                return {
                    animate: { rotate: [0, 3, -3, 0] },
                    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                };
            case 'sleeping':
                return {
                    animate: { y: [0, 5, 0], scale: [1, 1.02, 1] },
                    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                };
            default:
                return {
                    animate: { y: [0, -8, 0] },
                    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                };
        }
    };

    // Cursor tracking for eye movement
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current || pose !== 'front') return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        setCursorPosition({ x, y });
    }, [pose]);

    // Handle click
    const handleClick = () => {
        if (onPetClick) onPetClick();
    };

    // Display message from props
    useEffect(() => {
        if (message) {
            setCurrentMessage(message);
        } else {
            setCurrentMessage(null);
        }
    }, [message]);

    // Calculate eye position offset based on cursor (smaller movement)
    const eyeOffsetX = (cursorPosition.x - 0.5) * 6;
    const eyeOffsetY = (cursorPosition.y - 0.5) * 4;

    const moodAnimation = getMoodAnimation();

    return (
        <div
            ref={containerRef}
            className={`relative ${sizeClasses[size]} ${className} flex items-center justify-center`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setCursorPosition({ x: 0.5, y: 0.5 });
            }}
        >
            {/* Speech Bubble */}
            <AnimatePresence>
                {(showMessage || currentMessage) && currentMessage && (
                    <PetSpeechBubble message={currentMessage} />
                )}
            </AnimatePresence>

            {/* Turtle Container */}
            <motion.div
                onClick={handleClick}
                className="relative cursor-pointer"
                animate={moodAnimation.animate}
                transition={moodAnimation.transition}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: '300px', height: '400px' }}
            >
                {/* Main Turtle Image */}
                <img
                    src={getImage()}
                    alt="Turtle Pet"
                    className={`w-full h-full object-contain drop-shadow-2xl ${
                        pose === 'run-left' ? 'scale-x-[-1]' : ''
                    }`}
                    style={{
                        filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.15))',
                    }}
                    draggable={false}
                />

                {/* Eye Pupils Overlay - Only for front pose */}
                {pose === 'front' && (
                    <>
                        {/* Left Eye Pupil */}
                        <div
                            className="absolute w-2.5 h-2.5 bg-gray-900 rounded-full pointer-events-none"
                            style={{
                                top: '18.5%',
                                left: '39%',
                                transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
                                transition: 'transform 0.1s ease-out',
                            }}
                        >
                            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-80" />
                        </div>

                        {/* Right Eye Pupil */}
                        <div
                            className="absolute w-2.5 h-2.5 bg-gray-900 rounded-full pointer-events-none"
                            style={{
                                top: '18.5%',
                                left: '55%',
                                transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`,
                                transition: 'transform 0.1s ease-out',
                            }}
                        >
                            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-80" />
                        </div>
                    </>
                )}

                {/* Mood-based overlays */}
                {mood === 'celebrating' && (
                    <div className="absolute inset-0 pointer-events-none">
                        <motion.span
                            className="absolute top-0 left-4 text-2xl"
                            animate={{ y: [0, -20], opacity: [1, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            🎉
                        </motion.span>
                        <motion.span
                            className="absolute top-0 right-4 text-2xl"
                            animate={{ y: [0, -20], opacity: [1, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                        >
                            ⭐
                        </motion.span>
                        <motion.span
                            className="absolute top-1/4 right-0 text-xl"
                            animate={{ y: [0, -15], opacity: [1, 0] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
                        >
                            ✨
                        </motion.span>
                    </div>
                )}

                {mood === 'sleeping' && (
                    <motion.div
                        className="absolute top-4 right-4 text-3xl"
                        animate={{ opacity: [0, 1, 0], y: [0, -10, -20] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        💤
                    </motion.div>
                )}

                {mood === 'thinking' && (
                    <motion.div
                        className="absolute top-4 right-4 text-2xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        🤔
                    </motion.div>
                )}
            </motion.div>

            {/* Glow effect */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-[80px] -z-10 animate-pulse pointer-events-none"
                style={{
                    background: 'radial-gradient(circle, rgba(45,212,191,0.3) 0%, transparent 70%)',
                }}
            />
        </div>
    );
};

export default TurtlePet;
