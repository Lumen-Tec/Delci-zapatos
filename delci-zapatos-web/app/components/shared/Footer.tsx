'use client';

import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="hidden md:block relative z-10 w-full py-8 border-t border-rose-200/50 mt-auto bg-white/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                <p>© {new Date().getFullYear()} Delci Zapatos & Bolsos</p>
                <div className="flex gap-6">
                    <a href="https://lumentec.business" target="_blank" className="hover:text-rose-600 transition-colors">
                        Powerby Lumentec
                    </a>
                </div>
            </div>
        </footer>
    );
};
