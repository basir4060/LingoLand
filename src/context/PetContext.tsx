import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export type PetMood = 'idle' | 'happy' | 'excited' | 'thinking' | 'sleeping' | 'celebrating';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar' | 'ru' | 'hi' | 'nl' | 'sv' | 'pl' | 'tr' | 'vi' | 'th';

export const PET_MESSAGES = {
    greeting: ["Ready to learn?", "Hey there, friend!", "Let's have fun today!", "Hello! I missed you!"],
    encouragement: ["You're doing great!", "Keep it up!", "Wow, you're so smart!", "I believe in you!", "You're a star!"],
    hint: ["Hmm, try again!", "You've got this!", "Think about it...", "Almost there!", "Take your time!"],
    celebration: ["Amazing job!", "You did it!", "Woohoo!", "Fantastic!", "You're incredible!"],
    idle: ["Click me!", "What should we learn?", "I'm here to help!", "Let's play!"],
    goodbye: ["See you soon!", "Bye bye!", "Come back soon!"],
};

interface PetContextType {
    mood: PetMood;
    message: string | null;
    isVisible: boolean;
    learningLanguage: SupportedLanguage;
    nativeLanguage: SupportedLanguage;
    setLearningLanguage: (lang: SupportedLanguage) => void;
    setNativeLanguage: (lang: SupportedLanguage) => void;
    setMood: (mood: PetMood) => void;
    showMessage: (message: string, duration?: number) => void;
    showRandomMessage: (category: keyof typeof PET_MESSAGES) => void;
    celebrate: () => void;
    think: () => void;
    encourage: () => void;
    giveHint: () => void;
    sleep: () => void;
    wake: () => void;
    hide: () => void;
    show: () => void;
    greet: () => void;
    sayGoodbye: () => void;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

export const PetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mood, setMood] = useState<PetMood>('idle');
    const [message, setMessage] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [messageTimeout, setMessageTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
    const [learningLanguage, setLearningLanguage] = useState<SupportedLanguage>('es');
    const [nativeLanguage, setNativeLanguage] = useState<SupportedLanguage>('en');

    const showMessage = useCallback((msg: string, duration: number = 3500) => {
        if (messageTimeout) clearTimeout(messageTimeout);
        setMessage(msg);
        const timeout = setTimeout(() => setMessage(null), duration);
        setMessageTimeout(timeout);
    }, [messageTimeout]);

    const showRandomMessage = useCallback((category: keyof typeof PET_MESSAGES) => {
        const messages = PET_MESSAGES[category];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        showMessage(randomMsg);
    }, [showMessage]);

    const celebrate = useCallback(() => {
        setMood('celebrating');
        showRandomMessage('celebration');
        setTimeout(() => setMood('happy'), 3500);
    }, [showRandomMessage]);

    const think = useCallback(() => setMood('thinking'), []);

    const encourage = useCallback(() => {
        setMood('happy');
        showRandomMessage('encouragement');
    }, [showRandomMessage]);

    const giveHint = useCallback(() => {
        setMood('thinking');
        showRandomMessage('hint');
        setTimeout(() => setMood('idle'), 2500);
    }, [showRandomMessage]);

    const sleep = useCallback(() => { setMood('sleeping'); setMessage(null); }, []);
    const wake = useCallback(() => { setMood('idle'); showRandomMessage('greeting'); }, [showRandomMessage]);
    const greet = useCallback(() => { setMood('happy'); showRandomMessage('greeting'); }, [showRandomMessage]);
    const sayGoodbye = useCallback(() => { setMood('idle'); showRandomMessage('goodbye'); }, [showRandomMessage]);
    const hide = useCallback(() => setIsVisible(false), []);
    const show = useCallback(() => setIsVisible(true), []);

    return (
        <PetContext.Provider value={{
            mood, message, isVisible, learningLanguage, nativeLanguage,
            setLearningLanguage, setNativeLanguage, setMood, showMessage,
            showRandomMessage, celebrate, think, encourage, giveHint, sleep, wake, hide, show, greet, sayGoodbye,
        }}>
            {children}
        </PetContext.Provider>
    );
};

export const usePet = (): PetContextType => {
    const context = useContext(PetContext);
    if (!context) throw new Error('usePet must be used within a PetProvider');
    return context;
};

export default PetContext;
