import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Map, User, Home } from 'lucide-react';

interface NavbarProps {
    onStart: () => void;
    onHome: () => void;
    onLogout: () => void;
    onProfile: () => void;
    onAdventures: () => void;
    session: any;
}

const Navbar: React.FC<NavbarProps> = ({ onStart, onHome, onProfile, onAdventures, session }) => {

    const navItems = [
        { name: 'Home', icon: Home, color: 'text-blue-500', action: onHome },
        { name: 'Adventures', icon: Map, color: 'text-green-500', action: onAdventures },
        { name: 'Profile', icon: User, color: 'text-purple-500', action: onProfile },
    ];

    /* 
    const handleLogout = async () => {
        await supabase.auth.signOut();
        // The App component will detect the SIGNED_OUT event and switch views
    };
    */

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4"
        >
            <div className="bg-white/90 backdrop-blur-md border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-8 py-3 flex items-center gap-8 max-w-4xl w-full justify-between">

                {/* Logo */}
                <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="bg-gradient-to-br from-primary to-blue-500 p-2 rounded-xl text-white transform group-hover:rotate-12 transition-transform">
                        <Sparkles size={24} />
                    </div>
                    <span className="font-heading font-bold text-2xl text-gray-800 tracking-tight">
                        Lingo<span className="text-primary">Land</span>
                    </span>
                </div>

                {/* Links */}
                <div className="hidden md:flex items-center gap-2">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={item.action}
                            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors font-bold text-gray-600 hover:text-gray-900 group"
                        >
                            <item.icon size={20} className={`${item.color} group-hover:scale-110 transition-transform`} />
                            <span>{item.name}</span>
                        </button>
                    ))}
                </div>

                {/* CTA */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onStart}
                    className="bg-accent text-white font-heading font-bold text-lg px-6 py-2 rounded-full shadow-[0_4px_0_rgb(217,119,6)] active:shadow-none active:translate-y-1 transition-all"
                >
                    {session ? 'Continue Adventure' : 'Start Adventure'}
                </motion.button>

            </div>
        </motion.nav>
    );
};

export default Navbar;
