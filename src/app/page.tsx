import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { Services } from "@/components/Services";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import Providers from "./providers";

export default function Home() {
  return (
    <Providers>
      <main className="bg-black min-h-screen text-white selection:bg-purple-500/30 selection:text-purple-200">
        <Navbar />
        <Hero />
        <Portfolio />
        <Services />
        <Contact />
        <Footer />
      </main>
    </Providers>
  );
}
