import React from 'react';
import { Heart, Github, Twitter, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="relative bg-white pt-6 pb-4 overflow-hidden">
            {/* Wave Decoration */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0]">
                <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block h-[20px] w-[calc(100%+1.3px)] fill-blue-50">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
                </svg>
            </div>

            <div className="max-w-6xl mx-auto px-4 relative z-10">
                <div className="grid md:grid-cols-3 gap-4 mb-4 text-center md:text-left">
                    {/* Brand */}
                    <div>
                        <h2 className="font-heading font-bold text-xl text-gray-800 mb-1">
                            Lingo<span className="text-primary">Land</span>
                        </h2>
                        <p className="text-gray-500 font-medium text-sm">
                            Making language learning magical.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-heading font-bold text-lg text-gray-800 mb-2">Explore</h3>
                        <ul className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-500 font-medium text-sm">
                            <li><a href="#" className="hover:text-primary transition-colors">Our Mission</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Meet the ARTists</a></li>
                        </ul>
                    </div>

                    {/* Social/Community */}
                    <div>
                        <h3 className="font-heading font-bold text-xl text-gray-800 mb-4">Join the Fun</h3>
                        <div className="flex justify-center md:justify-start gap-4">
                            <a href="#" className="bg-blue-100 p-2 rounded-full text-blue-500 hover:bg-blue-500 hover:text-white transition-all"><Twitter size={20} /></a>
                            <a href="#" className="bg-pink-100 p-2 rounded-full text-pink-500 hover:bg-pink-500 hover:text-white transition-all"><Instagram size={20} /></a>
                            <a href="#" className="bg-gray-100 p-2 rounded-full text-gray-600 hover:bg-gray-800 hover:text-white transition-all"><Github size={20} /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex flex-col md:flex-row items-center justify-between gap-2">
                    <p className="text-gray-400 text-sm font-medium">
                        &copy; {new Date().getFullYear()} LingoLand. All rights reserved.
                    </p>

                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-1 rounded-full border border-purple-100">
                        <span className="text-gray-500 text-xs font-bold">Made with</span>
                        <Heart size={12} className="text-red-500 fill-red-500 animate-pulse" />
                        <span className="text-gray-500 text-xs font-bold">by</span>
                        <span className="font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary text-base">
                            ARTists
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
