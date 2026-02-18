import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { AlertCircle } from 'lucide-react';

const TigerDisplay: React.FC = () => {
    // Import all JSONs but we will filter for tiger
    const lottieFiles = import.meta.glob('../../assets/lottie/*.json', { eager: true });

    const [animationData, setAnimationData] = useState<any>(null);

    useEffect(() => {
        // Find the tiger file
        const tigerKey = Object.keys(lottieFiles).find(key => key.toLowerCase().includes('tiger'));

        if (tigerKey) {
            const module = lottieFiles[tigerKey] as any;
            setAnimationData(module.default || module);
        } else {
            // Fallback to first available if no tiger found
            const firstKey = Object.keys(lottieFiles)[0];
            if (firstKey) {
                const module = lottieFiles[firstKey] as any;
                setAnimationData(module.default || module);
            }
        }
    }, []);

    if (!animationData) {
        return (
            <div className="flex flex-col items-center justify-center text-center opacity-50">
                <AlertCircle className="mb-2" size={32} />
                <p>Tiger not found</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center">
            {/* Glow effect specific to Tiger */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-orange-500/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>

            <Lottie
                animationData={animationData}
                loop={true}
                className="w-full h-full drop-shadow-2xl"
                style={{
                    maxWidth: '120%', // Slight overscale for impact
                    maxHeight: '120%',
                }}
            />
        </div>
    );
};

export default TigerDisplay;
