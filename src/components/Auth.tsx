import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [language, setLanguage] = useState('');
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const languages = [
        "English", "Spanish", "French", "German", "Chinese", "Japanese",
        "Korean", "Italian", "Portuguese", "Russian", "Arabic", "Hindi",
        "Dutch", "Swedish", "Polish", "Turkish", "Vietnamese", "Thai"
    ];

    const filteredLanguages = languages.filter(lang =>
        lang.toLowerCase().includes(language.toLowerCase())
    );

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            primary_language: language,
                            avatar_url: `https://api.dicebear.com/9.x/adventurer/svg?seed=${firstName}`, // Dynamic Adventurer Avatar
                        }
                    }
                });
                if (error) throw error;
                alert('Sign up successful! Check your email for verification.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-xl border-4 border-white relative overflow-hidden"
            >
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl -mr-16 -mt-16 -z-0"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -ml-16 -mb-16 -z-0"></div>

                <div className="relative z-10 text-center mb-8">
                    <h2 className="font-heading font-bold text-3xl text-gray-800 mb-2">
                        {isSignUp ? 'Join the Adventure' : 'Welcome Back!'}
                    </h2>
                    <p className="text-gray-500 font-medium">
                        {isSignUp ? 'Create an account to start playing' : 'Sign in to continue your journey'}
                    </p>
                </div>

                <form onSubmit={handleAuth} className="relative z-10 flex flex-col gap-4">
                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold overflow-hidden"
                            >
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sign Up Fields */}
                    <AnimatePresence>
                        {isSignUp && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="flex flex-col gap-4 overflow-hidden"
                            >
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        required={isSignUp}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        required={isSignUp}
                                    />
                                </div>

                                {/* Searchable Language Input */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Primary Language"
                                        value={language}
                                        onChange={(e) => {
                                            setLanguage(e.target.value);
                                            setShowLanguageOptions(true);
                                        }}
                                        onFocus={() => setShowLanguageOptions(true)}
                                        className="w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 focus:bg-white transition-all outline-none font-bold text-gray-700"
                                        required={isSignUp}
                                    />
                                    <AnimatePresence>
                                        {showLanguageOptions && language.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border-2 border-gray-100 max-h-48 overflow-y-auto z-50 p-2"
                                            >
                                                {filteredLanguages.length > 0 ? (
                                                    filteredLanguages.map((lang) => (
                                                        <button
                                                            key={lang}
                                                            type="button"
                                                            onClick={() => {
                                                                setLanguage(lang);
                                                                setShowLanguageOptions(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2 rounded-lg hover:bg-purple-50 hover:text-purple-600 font-bold text-gray-600 transition-colors"
                                                        >
                                                            {lang}
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-2 text-gray-400 font-medium text-sm">No languages found</div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Email Field */}
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 focus:bg-white transition-all outline-none font-bold text-gray-700 placeholder:font-medium placeholder:text-gray-400"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 focus:bg-white transition-all outline-none font-bold text-gray-700 placeholder:font-medium placeholder:text-gray-400"
                            required
                        />
                    </div>

                    {/* Confirm Password */}
                    <AnimatePresence>
                        {isSignUp && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="relative overflow-hidden"
                            >
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-gray-100 focus:border-purple-400 focus:bg-white transition-all outline-none font-bold text-gray-700 placeholder:font-medium placeholder:text-gray-400 mt-4"
                                    required={isSignUp}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 bg-primary text-white font-heading font-bold text-lg py-4 rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            isSignUp ? 'Sign Up' : 'Let\'s Go!'
                        )}
                    </button>
                </form>

                <div className="relative z-10 mt-6 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-gray-500 font-bold hover:text-primary transition-colors text-sm"
                    >
                        {isSignUp
                            ? 'Already have an account? Sign in'
                            : 'Need an account? Sign up here'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
