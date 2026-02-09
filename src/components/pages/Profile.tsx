import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Star, Flame, Languages, Crown } from 'lucide-react';

interface ProfileProps {
    session: any;
    onLogout: () => void;
}

interface ProfileData {
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    primary_language: string;
    created_at: string;
}

interface UserProgress {
    level: number;
    stars: number;
    current_streak: number;
}

const Profile: React.FC<ProfileProps> = ({ session, onLogout }) => {
    if (!session) {
        return (
            <div className="min-h-screen pt-36 pb-12 px-4 bg-[#F0F4F8] flex justify-center items-center">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl text-center max-w-md w-full border-4 border-white">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-500">
                        <Crown size={40} />
                    </div>
                    <h2 className="font-heading font-bold text-2xl text-gray-800 mb-2">Who goes there?</h2>
                    <p className="text-gray-500 font-medium mb-8">
                        Please log in to view your profile and track your progress!
                    </p>
                    {/* We can redirect to Auth here if we want, or just show the message */}
                </div>
            </div>
        );
    }

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [progress, setProgress] = useState<UserProgress | null>(null);

    useEffect(() => {
        async function getProfile() {
            setLoading(true);
            const user = session.user;

            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('username, first_name, last_name, avatar_url, primary_language, created_at')
                .eq('id', user.id)
                .single();

            // Fetch Progress
            const { data: progressData } = await supabase
                .from('user_progress')
                .select('level, stars, current_streak')
                .eq('user_id', user.id)
                .single();

            if (profileData) setProfile(profileData);
            if (progressData) setProgress(progressData);
            setLoading(false);
        }

        getProfile();
    }, [session]);

    /* 
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };
    */

    if (loading) {
        return (
            <div className="min-h-screen pt-36 pb-12 px-4 bg-[#F0F4F8] flex justify-center items-start">
                <div className="animate-pulse bg-white p-8 rounded-[3rem] shadow-xl w-full max-w-lg h-96"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-36 pb-20 px-4 bg-[#F0F4F8] relative overflow-hidden font-body">

            {/* Background Atmosphere */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-50 to-transparent -z-10"></div>
            <div className="absolute top-20 right-[-100px] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl -z-10"></div>
            <div className="absolute top-40 left-[-100px] w-80 h-80 bg-blue-200/40 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: IDENTITY CARD */}
                    <div className="md:col-span-5">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border-2 border-white relative overflow-hidden text-center"
                        >
                            {/* Decorative Header */}
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-purple-400 to-indigo-500"></div>

                            {/* Avatar */}
                            <div className="relative z-10 mx-auto w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden mb-4 mt-12">
                                <img
                                    src={profile?.avatar_url || `https://api.dicebear.com/9.x/adventurer/svg?seed=${session.user.id}`}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <h1 className="font-heading font-black text-2xl text-gray-800 leading-tight">
                                {profile ? `${profile.first_name} ${profile.last_name}` : 'Explorer'}
                            </h1>
                            <p className="text-gray-400 font-bold text-sm mb-6">@{profile?.username}</p>

                            <button
                                onClick={onLogout}
                                className="mb-6 px-6 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-full font-bold text-sm transition-colors border border-red-100"
                            >
                                Log Out
                            </button>

                            <div className="text-left w-full mt-2">
                                <h3 className="font-heading font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <span className="bg-orange-100 p-1.5 rounded-lg text-orange-500"><Crown size={16} /></span>
                                    Pet Collection
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="aspect-square bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-purple-300 hover:bg-purple-50 transition-colors cursor-pointer group">
                                            {i === 1 ? (
                                                <img src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${session?.user?.id}`} className="w-8 h-8 opacity-80 group-hover:scale-110 transition-transform" alt="Pet" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-200 opacity-20"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* CENTER COLUMN: LANGUAGE PROGRESS */}
                    <div className="md:col-span-7 flex flex-col gap-6">

                        {/* Language Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Primary Language */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-colors group-hover:bg-blue-100"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                                            <Languages size={24} />
                                        </div>
                                        <span className="bg-green-100 text-green-600 font-bold text-xs px-2 py-1 rounded-lg">Active</span>
                                    </div>
                                    <h3 className="font-heading font-bold text-xl text-gray-800 mb-1">{profile?.primary_language || 'English'}</h3>
                                    <p className="text-gray-400 text-sm font-bold mb-4">Level 1 • Novice</p>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                                        <div className="bg-blue-500 h-full w-[35%] rounded-full relative">
                                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                        </div>
                                    </div>
                                    <p className="text-right text-xs font-bold text-gray-400 mt-2">35% to Lvl 2</p>
                                </div>
                            </motion.div>

                            {/* Secondary Language Placeholder */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center hover:bg-white hover:border-purple-200 transition-all cursor-pointer group"
                            >
                                <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                    <div className="bg-gray-100 text-gray-400 w-8 h-8 flex items-center justify-center rounded-full font-bold text-xl">+</div>
                                </div>
                                <h3 className="font-bold text-gray-400 group-hover:text-purple-500">Add Language</h3>
                            </motion.div>
                        </div>

                        {/* Level Header */}
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-white/50 relative overflow-hidden flex items-center justify-between"
                        >
                            <div className="absolute left-0 top-0 w-2 h-full bg-yellow-400"></div>
                            <div>
                                <h2 className="font-heading font-black text-3xl text-gray-800">Level {progress?.level || 1}</h2>
                                <p className="text-gray-500 font-medium">Novice Adventurer</p>
                            </div>
                            <div className="bg-yellow-100 p-4 rounded-full">
                                <Crown size={32} className="text-yellow-600 fill-yellow-600" />
                            </div>
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white p-6 rounded-[2rem] border-b-4 border-orange-100 shadow-sm"
                            >
                                <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-500 mb-4">
                                    <Flame size={24} className="fill-orange-500" />
                                </div>
                                <p className="font-heading font-black text-4xl text-gray-800">{progress?.current_streak || 0}</p>
                                <p className="text-gray-400 font-bold text-sm">Day Streak</p>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white p-6 rounded-[2rem] border-b-4 border-yellow-100 shadow-sm"
                            >
                                <div className="bg-yellow-100 w-12 h-12 rounded-2xl flex items-center justify-center text-yellow-500 mb-4">
                                    <Star size={24} className="fill-yellow-500" />
                                </div>
                                <p className="font-heading font-black text-4xl text-gray-800">{progress?.stars || 0}</p>
                                <p className="text-gray-400 font-bold text-sm">Total Stars</p>
                            </motion.div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
