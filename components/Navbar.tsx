"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="bg-indigo-600 text-white sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="text-2xl font-bold tracking-wide flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <span>🎨</span>
                        <span>Tezukuri Market</span>
                    </Link>
                    <div className="flex space-x-6 items-center">
                        {session ? (
                            <>
                                <Link
                                    href="/events/new"
                                    className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                                >
                                    + Post Event
                                </Link>
                                <span className="text-sm text-indigo-100 font-medium hidden sm:block">
                                    Hello, {session.user?.name || session.user?.email?.split('@')[0]}
                                </span>
                                <button
                                    onClick={() => signOut()}
                                    className="text-sm bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
                                >
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="text-indigo-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/auth/register"
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-indigo-700/20 transition-transform active:scale-95"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
