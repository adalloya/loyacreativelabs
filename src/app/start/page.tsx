import { QuoteWizard } from "@/components/QuoteWizard";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Providers from "../providers";

export default function StartPage() {
    return (
        <Providers>
            <main className="bg-black min-h-screen text-white selection:bg-purple-500/30 selection:text-purple-200 flex flex-col">
                <Navbar />

                <div className="flex-grow flex items-center justify-center pt-32 pb-24 px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black">
                    <QuoteWizard />
                </div>

                <Footer />
            </main>
        </Providers>
    );
}
