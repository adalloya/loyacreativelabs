"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { useLanguage } from "@/context/LanguageContext";

export default function SoftwareLabsHeader() {
    const { t } = useLanguage();
    const labs = t.softwareLabs || {
        badge: "Propiedad Intelectual // Software Labs",
        title: "No vendemos promesas. Construimos plataformas reales en producción.",
        description: "La mejor prueba de nuestra capacidad técnica es el software que desarrollamos para nosotros mismos. Tres plataformas independientes que demuestran nuestra maestría en audio DSP en tiempo real, biomecánica y visión artificial para la industria.",
    };

    return (
        <section id="software-labs" className="pt-28 pb-6 bg-black border-t border-white/5 relative">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-center space-y-4"
                >
                    <span className="inline-block px-3.5 py-1 text-xs font-mono tracking-widest text-zinc-300 uppercase bg-white/[0.06] rounded-full border border-white/10">
                        {labs.badge}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                        {labs.title}
                    </h2>
                    <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                        {labs.description}
                    </p>
                </motion.div>
            </Container>
        </section>
    );
}
