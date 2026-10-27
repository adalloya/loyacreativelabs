"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { Button } from "./ui/Button";
import { Menu, X, Globe, Sun, Moon, Waves } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getInitialTheme, setSiteTheme, Theme } from "@/lib/theme";

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { t, language, toggleLanguage } = useLanguage();
    const [theme, setTheme] = useState<Theme>("dark");
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileToggleRef = useRef<HTMLButtonElement>(null);

    // Cerrar menú móvil al hacer clic afuera o presionar Escape
    useEffect(() => {
        if (!isMobileMenuOpen) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const target = event.target as Node;
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(target) &&
                mobileToggleRef.current &&
                !mobileToggleRef.current.contains(target)
            ) {
                setIsMobileMenuOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside, true);
        document.addEventListener("touchstart", handleClickOutside, true);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside, true);
            document.removeEventListener("touchstart", handleClickOutside, true);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMobileMenuOpen]);

    useEffect(() => {
        setTheme(getInitialTheme());
        const handleThemeChange = (e: Event) => {
            const customEvt = e as CustomEvent<{ theme: Theme }>;
            if (customEvt.detail?.theme) {
                setTheme(customEvt.detail.theme);
            }
        };
        window.addEventListener("apex_theme_change", handleThemeChange);
        return () => window.removeEventListener("apex_theme_change", handleThemeChange);
    }, []);

    const toggleTheme = () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setTheme(nextTheme);
        setSiteTheme(nextTheme);
    };

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
                            sizes="(max-width: 768px) 128px, 160px"
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
                        { label: "APEX", href: "/apex" },
                        { label: "ARCO MAESTRO", href: "/arco-maestro" },
                        { label: "ACAPELLA", href: "/acapella" },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${item.label === "APEX"
                                ? "text-red-400 font-mono font-bold hover:text-red-300 px-2.5 py-1 rounded-full bg-red-950/30 border border-red-500/20"
                                : item.label === "ARCO MAESTRO"
                                ? "text-yellow-400 font-mono font-bold hover:text-yellow-300 px-2.5 py-1 rounded-full bg-yellow-950/30 border border-yellow-500/20"
                                : item.label === "ACAPELLA"
                                ? "text-blue-400 font-mono font-bold hover:text-blue-300 px-2.5 py-1 rounded-full bg-blue-950/30 border border-blue-500/20"
                                : "text-gray-300 hover:text-white"
                                }`}
                        >
                            {item.label === "APEX" && (
                                <Image
                                    src="/apex-logo.png"
                                    alt="APEX"
                                    width={16}
                                    height={16}
                                    className="w-4 h-4 rounded-md object-cover"
                                />
                            )}
                            {item.label === "ARCO MAESTRO" && (
                                <Image
                                    src="/logo-arco-maestro.png"
                                    alt="Arco Maestro"
                                    width={16}
                                    height={16}
                                    className="w-4 h-4 rounded-md object-cover"
                                />
                            )}
                            {item.label === "ACAPELLA" && (
                                <Image
                                    src="/acapella-logo.png"
                                    alt="Acapella"
                                    width={16}
                                    height={16}
                                    className="w-4 h-4 object-contain"
                                />
                            )}
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

                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl text-gray-300 hover:text-white transition-all bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08]"
                        title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                        aria-label="Cambiar tema"
                    >
                        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                    </button>

                    <Button href="/start" variant="primary" className="px-6 py-2 text-sm">
                        {t.nav.start}
                    </Button>
                </nav>

                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-3 md:hidden">
                    <button
                        onClick={toggleTheme}
                        className="text-white z-10 p-2 rounded-xl bg-white/[0.06] border border-white/10"
                        title={theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                        aria-label="Cambiar tema"
                    >
                        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button
                        onClick={toggleLanguage}
                        className="text-white z-10 uppercase font-medium text-sm flex items-center gap-1"
                    >
                        {language}
                    </button>
                    <button
                        ref={mobileToggleRef}
                        className="text-white z-10 p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>


                {/* Mobile Nav */}
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop para cerrar al hacer clic/tap afuera */}
                        <div
                            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-hidden="true"
                        />
                        <motion.div
                            ref={mobileMenuRef}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-0 left-0 right-0 bg-black border-b border-white/10 p-4 pt-6 pb-8 md:hidden flex flex-col gap-4 shadow-2xl z-40"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">NAVEGACIÓN</span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-400 hover:text-white border border-white/10 flex items-center justify-center transition-all active:scale-90"
                                    aria-label="Cerrar menú"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {[
                                { label: t.nav.work, href: "#work" },
                                { label: t.nav.services, href: "#services" },
                                { label: t.nav.about, href: "#about" },
                                { label: "APEX", href: "/apex" },
                                { label: "ARCO MAESTRO", href: "/arco-maestro" },
                                { label: "ACAPELLA", href: "/acapella" },
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`text-lg font-medium flex items-center gap-2 py-2 border-b border-white/5 ${item.label === "APEX"
                                        ? "text-red-400 font-mono font-bold"
                                        : item.label === "ARCO MAESTRO"
                                        ? "text-yellow-400 font-mono font-bold"
                                        : item.label === "ACAPELLA"
                                        ? "text-blue-400 font-mono font-bold"
                                        : "text-gray-300 hover:text-white"
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.label === "APEX" && (
                                        <Image
                                            src="/apex-logo.png"
                                            alt="APEX"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5 rounded-md object-cover"
                                        />
                                    )}
                                    {item.label === "ARCO MAESTRO" && (
                                        <Image
                                            src="/logo-arco-maestro.png"
                                            alt="Arco Maestro"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5 rounded-md object-cover"
                                        />
                                    )}
                                    {item.label === "ACAPELLA" && (
                                        <Image
                                            src="/acapella-logo.png"
                                            alt="Acapella"
                                            width={20}
                                            height={20}
                                            className="w-5 h-5 object-contain"
                                        />
                                    )}
                                    {item.label}
                                </Link>
                            ))}
                            <Link href="#contact" onClick={() => setIsMobileMenuOpen(false)}>
                                <Button className="w-full mt-4">{t.nav.start}</Button>
                            </Link>
                        </motion.div>
                    </>
                )}
            </Container>
        </motion.header>
    );
}
