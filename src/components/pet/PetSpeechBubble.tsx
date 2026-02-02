import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PetSpeechBubbleProps {
    message: string;
    position?: 'top' | 'left' | 'right';
    className?: string;
}

const PetSpeechBubble: React.FC<PetSpeechBubbleProps> = ({
    message,
    position = 'top',
    className = '',
}) => {
    const positionStyles = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-4',
        left: 'right-full top-1/2 -translate-y-1/2 mr-4',
        right: 'left-full top-1/2 -translate-y-1/2 ml-4',
    };

    const tailStyles = {
        top: 'top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white',
        left: 'left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white',
        right: 'right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white',
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : 0 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`absolute ${positionStyles[position]} z-50 ${className}`}
            >
                <div className="relative bg-white rounded-2xl px-5 py-3 shadow-lg border-2 border-purple-100 max-w-[250px]">
                    <p className="text-gray-700 font-bold text-sm text-center whitespace-pre-wrap">
                        {message}
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent rounded-2xl pointer-events-none" />
                    <div className={`absolute w-0 h-0 ${tailStyles[position]}`} />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PetSpeechBubble;
