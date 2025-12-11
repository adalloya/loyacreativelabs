
"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Providers from "../providers";
import { detailedProjects } from "@/data/content";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Code, Layers, Zap } from "lucide-react";

export default function PortfolioPage() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <Providers>
            <main ref={containerRef} className="bg-black min-h-screen text-white font-sans selection:bg-purple-500/30">
                <Navbar />

                {/* HERO SECTION */}
                <section className="min-h-[70vh] flex flex-col justify-center items-center px-4 relative overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-900 rounded-full blur-[120px]" />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="relative z-10 text-center space-y-6 max-w-4xl mx-auto"
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm uppercase tracking-widest text-gray-400 backdrop-blur-md">
                            Selected Work 2024-2025
                        </span>
                        <h1 className="text-5xl md:text-8xl font-bold tracking-tighter bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                            Digital Masterpieces.
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl mx-auto leading-relaxed">
                            We don't just build websites. We craft digital ecosystems that transform businesses and define brands.
                        </p>
                    </motion.div>
                </section>

                {/* PROJECTS LIST */}
                <div className="pb-40 space-y-32">
                    {detailedProjects.map((project, index) => (
                        <ProjectCard key={project.id} project={project} index={index} />
                    ))}
                </div>

                {/* CTA FOOTER */}
                <section className="py-20 text-center relative z-10">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8">Ready to be next?</h2>
                    <Link href="/start" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-gray-200 transition-all hover:scale-105">
                        Start Project <Zap className="w-5 h-5 fill-black" />
                    </Link>
                </section>

                <Footer />
            </main>
        </Providers>
    );
}

function ProjectCard({ project, index }: { project: any, index: number }) {
    const cardRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "center center"]
    });

    // Parallax & Fade effects
    const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [0.5, 1]);

    return (
        <motion.section
            ref={cardRef}
            style={{ scale, opacity }}
            className="px-4 md:px-8 max-w-7xl mx-auto"
        >
            <div className={`group relative rounded-[2.5rem] overflow-hidden bg-zinc-900/50 border border-zinc-800 transition-colors hover:border-zinc-700`}>

                {/* Background Glow based on project color */}
                <div className={`absolute -inset-0 bg-gradient-to-r ${project.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700 blur-3xl`} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[600px]">

                    {/* INFO COLUMN */}
                    <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-between relative z-10 bg-black/20 backdrop-blur-sm lg:backdrop-blur-none">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 border border-zinc-800 px-3 py-1 rounded-full">
                                    {project.category}
                                </span>
                                <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${project.color}`} />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-5xl font-bold leading-tight group-hover:text-white transition-colors duration-300">
                                    {project.title}
                                </h2>
                                <h3 className="text-xl text-gray-400 font-light">{project.subtitle}</h3>
                                <p className="text-gray-400 leading-relaxed text-sm md:text-base pr-8">
                                    {project.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-800/50">
                                <div>
                                    <h4 className="text-xs uppercase text-gray-500 font-bold mb-3 flex items-center gap-2">
                                        <Code className="w-3 h-3" /> Tech Stack
                                    </h4>
                                    <ul className="space-y-1">
                                        {project.tech.map((t: string) => (
                                            <li key={t} className="text-sm text-gray-300">{t}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-xs uppercase text-gray-500 font-bold mb-3 flex items-center gap-2">
                                        <Layers className="w-3 h-3" /> Key Features
                                    </h4>
                                    <ul className="space-y-1">
                                        {project.features.slice(0, 3).map((f: string) => ( // Show only top 3
                                            <li key={f} className="text-sm text-gray-300 truncate" title={f}>{f}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="pt-12 flex items-end justify-between">
                            <div className="text-center">
                                <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                    {project.stats.value}
                                </div>
                                <div className="text-xs text-gray-500 uppercase tracking-widest">{project.stats.label}</div>
                            </div>

                            <Link
                                href={project.url}
                                target="_blank"
                                className="group/btn inline-flex items-center gap-3 px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-gray-200 transition-all hover:scale-105"
                            >
                                Visit Live <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:rotate-45" />
                            </Link>
                        </div>
                    </div>

                    {/* IMAGE COLUMN */}
                    <div className="relative h-[300px] lg:h-auto overflow-hidden bg-zinc-900">
                        {/* Placeholder for now, can be replaced with real Next/Image */}
                        <div className={`w-full h-full bg-gradient-to-br ${project.color} opacity-20 flex items-center justify-center text-4xl font-bold text-white/10 select-none group-hover:scale-105 transition-transform duration-700`}>
                            {project.title} Preview
                        </div>
                        {/* 
                           Uncomment when real images are ready:
                           <Image src={project.image} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                        */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent lg:bg-gradient-to-l lg:from-zinc-900/50" />
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

