"use client";

import Image from "next/image";
import Link from "next/link";
import { Container } from "./ui/Container";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
    const { t } = useLanguage();
    return (
        <footer className="bg-black border-t border-white/10 py-12 md:py-20">
            <Container>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <Link href="/" className="text-2xl font-bold text-white mb-4 block">
                            LOYA <span className="text-gray-500">CREATIVE LAB</span>
                        </Link>
                        <p className="text-gray-500 text-sm max-w-xs">
                            {t.footer.description}
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 text-sm text-gray-400 items-start md:items-center">
                        <Link 
                            href="/apex" 
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-red-500/40 text-white font-mono text-xs transition-all group"
                        >
                            <div className="relative w-4 h-4 rounded overflow-hidden">
                                <Image
                                    src="/apex-logo.png"
                                    alt="APEX"
                                    width={16}
                                    height={16}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span className="text-red-400 font-bold group-hover:text-red-300">APEX</span>
                        </Link>
                        <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
                        <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
                        <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                        <Link href="mailto:hello@loyacreativelab.com" className="hover:text-white transition-colors">hello@loyacreativelab.com</Link>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
                    <p>&copy; {new Date().getFullYear()} Loya Creative Lab.  {t.footer.rights}</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <Link href="#"> {t.footer.privacy}</Link>
                        <Link href="#"> {t.footer.terms}</Link>
                    </div>
                </div>
            </Container>
        </footer>
    );
}
