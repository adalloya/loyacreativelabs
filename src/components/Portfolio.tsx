"use client";

import { motion } from "framer-motion";
import { Container } from "./ui/Container";
import { useLanguage } from "@/context/LanguageContext";
import { Marquee } from "./ui/Marquee";
import { AyjaleLogo, HereWeGoLogo, EonLogo, DraLisethLogo, KandyEmotionLogo } from "./ClientLogos";

export function Portfolio() {
    const { t } = useLanguage();

    const logos = [
        { component: <AyjaleLogo />, url: "https://ayjale.com" },
        { component: <HereWeGoLogo />, url: "https://herewego.com.mx" },
        { component: <EonLogo />, url: "https://eonconsultoria.com.mx" },
        { component: <DraLisethLogo />, url: "https://dralisethguevara.com" },
        { component: <KandyEmotionLogo />, url: "https://kandyemotion.com" },
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
            <div className="relative w-full flex justify-center">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-black to-transparent z-10"></div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-black to-transparent z-10"></div>

                <Marquee
                    items={logos.map((logo, index) => (
                        <a
                            key={index}
                            href={logo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-[200px] hover:opacity-80 transition-opacity duration-300"
                        >
                            {logo.component}
                        </a>
                    ))}
                    direction="left"
                    speed="normal"
                    className="py-10"
                />
            </div>
        </section>
    );
}
