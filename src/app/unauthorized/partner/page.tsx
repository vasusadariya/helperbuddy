"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Unauthorized() {
    const [currentTime, setCurrentTime] = useState("2025-02-17 21:54:03");

    useEffect(() => {
        // Update time every second
        const timer = setInterval(() => {
            const now = new Date();
            const formattedTime = now.toISOString().replace('T', ' ').split('.')[0];
            setCurrentTime(formattedTime);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 flex flex-col items-center justify-center p-4">
            {/* Animated background pattern */}
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px] animate-grid-fade pointer-events-none"></div>
            
            <div className="relative bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full text-center shadow-2xl border border-white/10">
                {/* Error Icon */}
                <div className="mb-6 relative">
                    <div className="w-24 h-24 bg-purple-500/10 rounded-full mx-auto flex items-center justify-center">
                        <svg 
                            className="w-12 h-12 text-purple-400 animate-pulse" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 15v2m0 2h.01M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" 
                            />
                        </svg>
                    </div>
                </div>

                {/* Error Message */}
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                    403 - Partner Access Required
                </h1>
                
                <div className="space-y-3 mb-8">
                    <p className="text-lg text-gray-300">
                        This area is restricted to partner accounts.
                    </p>
                    <p className="text-sm text-gray-400">
                        Please sign in with your partner credentials to access this resource.
                    </p>
                </div>

                {/* System Info Card */}
                <div className="mb-8 text-sm text-gray-400 bg-white/5 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <span>Time (UTC):</span>
                        <span className="font-mono text-purple-300">{currentTime}</span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                        Partner access is required for this section
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                    <Link 
                        href="/signin"
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 group"
                    >
                        <svg 
                            className="w-5 h-5 mr-2 group-hover:animate-bounce" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M17 8l4 4m0 0l-4 4m4-4H3m4 4v4m0-16v4" 
                            />
                        </svg>
                        Sign in as Partner
                    </Link>

                    <Link 
                        href="/"
                        className="inline-flex items-center justify-center w-full px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transform hover:scale-[1.02] transition-all duration-200"
                    >
                        <svg 
                            className="w-5 h-5 mr-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                            />
                        </svg>
                        Return to Home
                    </Link>
                </div>

                {/* Help Text */}
                <p className="mt-6 text-sm text-gray-400">
                    Need a partner account?{" "}
                    <Link
                        href="/register"
                        className="text-purple-400 hover:text-purple-300 hover:underline transition-colors duration-200"
                    >
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}