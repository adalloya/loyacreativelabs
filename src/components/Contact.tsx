"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { Button } from "./ui/Button";
import { useLanguage } from "@/context/LanguageContext";

export function Contact() {
    const { t } = useLanguage();
    return (
        <section id="contact" className="py-24 md:py-32 relative overflow-hidden bg-black border-t border-white/5">
            <Container className="relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto space-y-6"
                >
                    <span className="inline-block px-3.5 py-1 text-xs font-mono tracking-widest text-zinc-300 uppercase bg-white/[0.06] rounded-full border border-white/10">
                        {t.contact.badge || "Inicia Tu Transformación"}
                    </span>
                    <h2 className="text-3xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                        {t.contact.title}
                    </h2>
                    <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        {t.contact.description}
                    </p>
                    <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Button href="https://wa.me/526271231192" className="px-8 py-4 text-base font-semibold w-full sm:w-auto bg-white text-black hover:bg-zinc-200 shadow-xl">
                            {t.contact.whatsapp}
                        </Button>
                        <Button href="mailto:hello@loyacreativelab.com" variant="outline" className="px-8 py-4 text-base font-semibold w-full sm:w-auto border-white/20 text-white hover:bg-white/10">
                            {t.contact.email}
                        </Button>
                    </div>
                </motion.div>
            </Container>
        </section>
    );
}
