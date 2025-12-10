"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { Button } from "./ui/Button";

export function Contact() {
    return (
        <section id="contact" className="py-24 md:py-32 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none" />

            <Container className="relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">
                        Ready to start your next project?
                    </h2>
                    <p className="text-xl text-gray-400 mb-10">
                        Let's collaborate to build something extraordinary. Reach out to us and let's discuss your vision.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button href="mailto:hello@loyacreativelab.com" className="px-10 py-4 text-xl">
                            Get in Touch
                        </Button>
                        <Button href="https://wa.me/" variant="outline" className="px-10 py-4 text-xl">
                            WhatsApp
                        </Button>
                    </div>
                </motion.div>
            </Container>
        </section>
    );
}
