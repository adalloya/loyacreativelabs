"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { useLanguage } from "@/context/LanguageContext";
import { Marquee } from "./ui/Marquee";
import { AyjaleLogo, HereWeGoLogo, EonLogo, DraLisethLogo, KandyEmotionLogo } from "./ClientLogos";

export function Portfolio() {
    const { t } = useLanguage();

    const logos = [
        <AyjaleLogo key="ayjale" />,
        <HereWeGoLogo key="herewego" />,
        <EonLogo key="eon" />,
        <DraLisethLogo key="draliseth" />,
        <KandyEmotionLogo key="kandy" />,
    ];

    return (
        <section id="work" className="py-24 md:py-32 bg-zinc-900/50 overflow-hidden">
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-center"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">{t.portfolio.title}</h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        {t.portfolio.description}
                    </p>
                </motion.div>
            </Container>


            {/* Marquee Section */}
            <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black to-transparent z-10"></div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-black to-transparent z-10"></div>

                <Marquee
                    items={logos}
                    direction="left" // Default is usually left (moving towards left), user asked "right to left" which is normal marquee.
                    speed="normal"
                    className="py-10"
                />
            </div>
        </section>
    );
}
