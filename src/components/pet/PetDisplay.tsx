import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence, wrap } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const variants = {
    enter: (direction: number) => {
        return {
            x: direction > 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.5,
        };
    },
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => {
        return {
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0,
            scale: 0.5,
        };
    },
};

const PetDisplay: React.FC = () => {
    const lottieFiles = import.meta.glob('../../assets/lottie/*.json', { eager: true });

    const [pets, setPets] = useState<any[]>([]);
    const [[page, direction], setPage] = useState([0, 0]);

    useEffect(() => {
        const loadedPets = Object.keys(lottieFiles).map(key => {
            const module = lottieFiles[key] as any;
            const animationData = module.default || module;
            return { data: animationData };
        });
        setPets(loadedPets);
    }, []);

    const imageIndex = pets.length > 0 ? wrap(0, pets.length, page) : 0;

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    useEffect(() => {
        if (pets.length === 0) return;
        const timer = setInterval(() => {
            paginate(1);
        }, 5000);
        return () => clearInterval(timer);
    }, [page, pets.length]);

    if (pets.length === 0) {
        return (
            <div className="rounded-3xl h-64 w-full flex flex-col items-center justify-center text-center">
                <AlertCircle className="text-indigo-400 mb-2" size={32} />
                <p className="text-gray-500">No pets found.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative flex items-center justify-center">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-white/40 rounded-full blur-3xl -z-10"></div>
            <div className="relative w-full h-full flex items-center justify-center overflow-visible">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                    <motion.div
                        key={page}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        className="absolute w-full h-full flex flex-col items-center justify-center"
                    >
                        <div className="w-full h-full flex items-center justify-center scale-125">
                            <Lottie
                                animationData={pets[imageIndex].data}
                                loop={true}
                                className="w-full h-full"
                                style={{ maxWidth: 'none', maxHeight: 'none' }}
                            />
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PetDisplay;
