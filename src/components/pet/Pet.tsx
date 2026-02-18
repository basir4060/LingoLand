import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import PetSpeechBubble from './PetSpeechBubble';

export type PetMood = 'idle' | 'happy' | 'excited' | 'thinking' | 'sleeping' | 'celebrating';

interface PetProps {
    mood?: PetMood;
    message?: string | null;
    onPetClick?: () => void;
    showMessage?: boolean;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const Pet: React.FC<PetProps> = ({
    mood = 'idle',
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
    const [riveError, setRiveError] = useState(false);

    const sizeClasses = {
        small: 'w-32 h-32',
        medium: 'w-48 h-48',
        large: 'w-full h-full',
    };

    const RIVE_FILE_PATH = '/assets/pet.riv';

    const { rive, RiveComponent } = useRive({
        src: RIVE_FILE_PATH,
        stateMachines: 'PetStateMachine',
        layout: new Layout({
            fit: Fit.Contain,
            alignment: Alignment.Center,
        }),
        autoplay: true,
        onLoadError: () => {
            setRiveError(true);
        },
    });

    const moodInput = useStateMachineInput(rive, 'PetStateMachine', 'mood');
    const lookXInput = useStateMachineInput(rive, 'PetStateMachine', 'lookX');
    const lookYInput = useStateMachineInput(rive, 'PetStateMachine', 'lookY');
    const isHoveredInput = useStateMachineInput(rive, 'PetStateMachine', 'isHovered');
    const isTalkingInput = useStateMachineInput(rive, 'PetStateMachine', 'isTalking');

    useEffect(() => {
        if (moodInput) {
            const moodValues: Record<PetMood, number> = {
                idle: 0, happy: 1, excited: 2, thinking: 3, sleeping: 4, celebrating: 5,
            };
            moodInput.value = moodValues[mood];
        }
    }, [mood, moodInput]);

    useEffect(() => {
        if (isHoveredInput) isHoveredInput.value = isHovered;
    }, [isHovered, isHoveredInput]);

    useEffect(() => {
        if (isTalkingInput) isTalkingInput.value = !!(message || currentMessage);
    }, [message, currentMessage, isTalkingInput]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        setCursorPosition({ x, y });
        if (lookXInput) lookXInput.value = x * 100;
        if (lookYInput) lookYInput.value = y * 100;
    }, [lookXInput, lookYInput]);

    const handleClick = () => {
        if (onPetClick) onPetClick();
    };

    useEffect(() => {
        if (message) {
            setCurrentMessage(message);
        } else {
            setCurrentMessage(null);
        }
    }, [message]);

    return (
        <div
            ref={containerRef}
            className={`relative ${sizeClasses[size]} ${className}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setCursorPosition({ x: 0.5, y: 0.5 }); }}
        >
            {(showMessage || currentMessage) && currentMessage && (
                <PetSpeechBubble message={currentMessage} />
            )}
            <div onClick={handleClick} className="w-full h-full cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95">
                {!riveError && <RiveComponent className="w-full h-full" />}
                {riveError && <PetPlaceholder mood={mood} cursorPosition={cursorPosition} isHovered={isHovered} />}
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-purple-400/20 rounded-full blur-[80px] -z-10 animate-pulse pointer-events-none" />
        </div>
    );
};

interface PlaceholderProps {
    mood: PetMood;
    cursorPosition: { x: number; y: number };
    isHovered: boolean;
}

const PetPlaceholder: React.FC<PlaceholderProps> = ({ mood, cursorPosition, isHovered }) => {
    const eyeOffsetX = (cursorPosition.x - 0.5) * 10;
    const eyeOffsetY = (cursorPosition.y - 0.5) * 6;

    const getMouthPath = () => {
        switch (mood) {
            case 'happy': case 'excited': case 'celebrating': return 'M 35 58 Q 50 72 65 58';
            case 'thinking': return 'M 42 62 Q 50 58 58 62';
            case 'sleeping': return 'M 42 62 L 58 62';
            default: return 'M 38 58 Q 50 66 62 58';
        }
    };

    const getEyeContent = () => {
        if (mood === 'sleeping') {
            return (
                <>
                    <path d="M 30 32 Q 38 28 46 32" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
                    <path d="M 54 32 Q 62 28 70 32" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round" />
                </>
            );
        }
        if (mood === 'celebrating') {
            return (
                <>
                    <text x="32" y="38" fontSize="16" textAnchor="middle">⭐</text>
                    <text x="68" y="38" fontSize="16" textAnchor="middle">⭐</text>
                </>
            );
        }
        return (
            <>
                <ellipse cx="38" cy="34" rx="9" ry="10" fill="white" />
                <ellipse cx="62" cy="34" rx="9" ry="10" fill="white" />
                <circle cx={38 + eyeOffsetX} cy={34 + eyeOffsetY} r="5" fill="#1F2937" />
                <circle cx={62 + eyeOffsetX} cy={34 + eyeOffsetY} r="5" fill="#1F2937" />
                <circle cx={36 + eyeOffsetX} cy={32 + eyeOffsetY} r="2" fill="white" />
                <circle cx={60 + eyeOffsetX} cy={32 + eyeOffsetY} r="2" fill="white" />
            </>
        );
    };

    return (
        <div className="w-full h-full flex items-center justify-center">
            <svg 
                viewBox="0 0 100 100" 
                className={`w-3/4 h-3/4 transition-all duration-300 ${isHovered ? 'scale-110' : ''} ${mood === 'excited' || mood === 'celebrating' ? 'animate-bounce' : ''}`}
            >
                <ellipse cx="50" cy="70" rx="30" ry="22" fill="#8B5CF6" />
                <circle cx="50" cy="40" r="32" fill="#A78BFA" />
                <ellipse cx="24" cy="18" rx="10" ry="14" fill="#A78BFA" />
                <ellipse cx="76" cy="18" rx="10" ry="14" fill="#A78BFA" />
                <ellipse cx="24" cy="18" rx="6" ry="9" fill="#DDD6FE" />
                <ellipse cx="76" cy="18" rx="6" ry="9" fill="#DDD6FE" />
                {getEyeContent()}
                {(mood === 'happy' || mood === 'celebrating' || mood === 'excited') && (
                    <>
                        <ellipse cx="22" cy="46" rx="7" ry="4" fill="#F9A8D4" opacity="0.6" />
                        <ellipse cx="78" cy="46" rx="7" ry="4" fill="#F9A8D4" opacity="0.6" />
                    </>
                )}
                <ellipse cx="50" cy="48" rx="5" ry="4" fill="#7C3AED" />
                <path d={getMouthPath()} stroke="#7C3AED" strokeWidth="3" fill="none" strokeLinecap="round" />
                {mood === 'thinking' && (
                    <>
                        <circle cx="82" cy="20" r="4" fill="#E5E7EB" />
                        <circle cx="90" cy="10" r="6" fill="#E5E7EB" />
                        <text x="88" y="14" fontSize="8">🤔</text>
                    </>
                )}
                {mood === 'sleeping' && (
                    <text x="75" y="20" fontSize="16" fill="#7C3AED" className="animate-pulse">💤</text>
                )}
                {mood === 'celebrating' && (
                    <>
                        <text x="10" y="25" fontSize="14">🎉</text>
                        <text x="80" y="15" fontSize="12">✨</text>
                        <text x="5" y="60" fontSize="10">🎊</text>
                        <text x="88" y="55" fontSize="12">⭐</text>
                    </>
                )}
            </svg>
        </div>
    );
};

export default Pet;
