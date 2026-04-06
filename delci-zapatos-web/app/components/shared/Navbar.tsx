'use client';

import Image from 'next/image';
import Link from 'next/link';
export const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-br from-pink-200/90 via-pink-300/90 to-rose-300/90 backdrop-blur-md border-b border-rose-200/50 shadow-sm font-sans">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-2">
        <Link href="/dashboard" className="flex items-center shrink-0">
          <div className="relative h-16 w-32">
            <Image
              src="https://res.cloudinary.com/drec8g03e/image/upload/v1772501928/delci-zapatos_jhguv9.png"
              alt="Delci Zapatos Logo"
              fill
              className="object-contain object-left"
              priority
              sizes="128px"
            />
          </div>
        </Link>
      </div>
    </nav>
  );
};