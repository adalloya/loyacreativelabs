"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { Button } from "./ui/Button";
import { Menu, X, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, language, toggleLanguage } = useLanguage();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-black/50 backdrop-blur-md border-b border-white/10 py-4" : "py-6 bg-transparent"
                }`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Container className="flex items-center justify-between">
                <Link href="/" className="relative z-10 w-32 md:w-40">
                    {/* Inverting the logo since it's black on transparent and background is dark */}
                    <div className="relative h-12 w-full invert select-none">
                        <Image
                            src="/logo.png"
                            alt="Loya Creative Lab"
                            fill
                            className="object-contain object-left"
                            priority
                        />
                    </div>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {[
                        { label: t.nav.work, href: "#work" },
                        { label: t.nav.services, href: "#services" },
                        { label: t.nav.about, href: "#about" },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                        >
                            {item.label}
                        </Link>
                    ))}

                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors uppercase"
                    >
                        <Globe size={16} />
                        {language}
                    </button>

                    <Button href="/start" variant="primary" className="px-6 py-2 text-sm">
                        {t.nav.start}
                    </Button>
                </nav>

                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-4 md:hidden">
                    <button
                        onClick={toggleLanguage}
                        className="text-white z-10 uppercase font-medium text-sm flex items-center gap-1"
                    >
                        {language}
                    </button>
                    <button
                        className="text-white z-10 p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>


                {/* Mobile Nav */}
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-0 left-0 right-0 bg-black border-b border-white/10 p-4 pt-24 pb-8 md:hidden flex flex-col gap-4 shadow-2xl"
                    >
                        {[
                            { label: t.nav.work, href: "#work" },
                            { label: t.nav.services, href: "#services" },
                            { label: t.nav.about, href: "#about" },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="text-lg font-medium text-gray-300 hover:text-white block py-2 border-b border-white/5"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link href="#contact" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full mt-4">{t.nav.start}</Button>
                        </Link>
                    </motion.div>
                )}
            </Container>
        </motion.header>
    );
}
