"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { Button } from "./ui/Button";
import { useLanguage } from "@/context/LanguageContext";

export function Hero() {
    const { t } = useLanguage();
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">

            {/* Background Video */}
            <div className="absolute inset-0 w-full h-full z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src="/hero-bg.mp4" type="video/mp4" />
                </video>
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/60 z-10" />
            </div>

            <Container className="relative z-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center max-w-4xl mx-auto"
                >
                    <span className="inline-block px-3.5 py-1 mb-6 text-xs font-medium tracking-wider text-zinc-300 uppercase bg-white/[0.06] rounded-full border border-white/10 backdrop-blur-md">
                        {t.hero.badge}
                    </span>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 text-white pb-2">
                        {t.hero.title}
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
                        {t.hero.description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button href="#work" className="text-lg min-w-[160px]">
                            {t.hero.ctaWork}
                        </Button>
                        <Button href="#contact" variant="outline" className="text-lg min-w-[160px]">
                            {t.hero.ctaContact}
                        </Button>
                    </div>

                    {/* Apple Style Apps Dock */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.8 }}
                        className="mt-12 flex flex-col items-center gap-3"
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">
                                Software Labs // 4 Plataformas en Producción
                            </span>
                        </div>
                        <div className="flex items-center gap-5 sm:gap-8 px-6 py-3.5 rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-2xl">
                            <Link
                                href="/acapella"
                                className="group flex flex-col items-center gap-1.5 transition-transform hover:-translate-y-1 focus:outline-none"
                            >
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-[22%] overflow-hidden bg-black/80 border border-white/15 shadow-lg group-hover:border-white/40 group-hover:shadow-[0_8px_20px_rgba(255,255,255,0.12)] transition-all">
                                    <Image
                                        src="/acapella-icon.png"
                                        alt="Acapella"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-400 group-hover:text-white transition-colors">
                                    Acapella
                                </span>
                            </Link>

                            <Link
                                href="/apex"
                                className="group flex flex-col items-center gap-1.5 transition-transform hover:-translate-y-1 focus:outline-none"
                            >
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-[22%] overflow-hidden bg-black/80 border border-white/15 shadow-lg group-hover:border-white/40 group-hover:shadow-[0_8px_20px_rgba(255,255,255,0.12)] transition-all">
                                    <Image
                                        src="/apex-icon.png"
                                        alt="APEX"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-400 group-hover:text-white transition-colors">
                                    APEX
                                </span>
                            </Link>

                            <Link
                                href="/arco-maestro"
                                className="group flex flex-col items-center gap-1.5 transition-transform hover:-translate-y-1 focus:outline-none"
                            >
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-[22%] overflow-hidden bg-black/80 border border-white/15 shadow-lg group-hover:border-white/40 group-hover:shadow-[0_8px_20px_rgba(255,255,255,0.12)] transition-all">
                                    <Image
                                        src="/logo-arco-maestro.png"
                                        alt="Arco Maestro"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-400 group-hover:text-white transition-colors">
                                    Arco Maestro
                                </span>
                            </Link>

                            <Link
                                href="/scope"
                                className="group flex flex-col items-center gap-1.5 transition-transform hover:-translate-y-1 focus:outline-none"
                            >
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-[22%] overflow-hidden bg-black/80 border border-white/15 shadow-lg group-hover:border-emerald-400/50 group-hover:shadow-[0_8px_20px_rgba(0,230,153,0.18)] transition-all">
                                    <Image
                                        src="/scope-icon.png"
                                        alt="Scope"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="text-[11px] font-medium text-zinc-400 group-hover:text-white transition-colors">
                                    Scope
                                </span>
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
            </Container>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
                <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-2">
                    <div className="w-1 h-3 bg-white/50 rounded-full" />
                </div>
            </motion.div>

            {/* Curved Bottom Divider */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 pointer-events-none">
                <svg
                    data-name="Layer 1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="relative block w-full h-[150px] fill-black"
                >
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="hidden"></path>
                    {/* Simple Smile Curve */}
                    <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="hidden"></path>
                    {/* The requested 'curve up on both sides' means the video edges go up. 
                        The MASK (black) must be TALLER at the edges. 
                        M0,0 (Top Left of SVG) -> Curve Down Middle -> Top Right. 
                        Actually, SVG Y=0 is Top. 
                        If I want Black to cover edges. 
                        Path should start at 0,0. Curve down to 600,120. Curve up to 1200,0. 
                    */}
                    <path d="M0,0H1200V120H0V0Z" fill="none" />
                    <path d="M0,0 Q600,180 1200,0 V120 H0 Z" fill="#000000"></path>
                </svg>
            </div>
        </section>
    );
}
