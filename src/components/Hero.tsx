"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { Button } from "./ui/Button";

export function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[128px] pointer-events-none" />

            <Container className="relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <span className="inline-block px-3 py-1 mb-6 text-xs font-semibold tracking-wider text-purple-400 uppercase bg-purple-900/30 rounded-full border border-purple-500/30">
                        Digital Experience Agency
                    </span>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
                        We Craft <br />
                        Digital Masterpieces
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-10 leading-relaxed">
                        Elevate your brand with incredible UX, cutting-edge technology, and designs that leave a lasting impression.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button href="#work" className="text-lg">
                            View Our Work
                        </Button>
                        <Button href="#contact" variant="outline" className="text-lg">
                            Contact Us
                        </Button>
                    </div>
                </motion.div>
            </Container>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
                <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-2">
                    <div className="w-1 h-3 bg-white/50 rounded-full" />
                </div>
            </motion.div>
        </section>
    );
}
