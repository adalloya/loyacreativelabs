import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { Services } from "@/components/Services";
import { ProblemSolution } from "@/components/ProblemSolution";
import { TechStack } from "@/components/TechStack";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import Providers from "./providers";

export default function Home() {
  return (
    <Providers>
      <main className="bg-black min-h-screen text-white selection:bg-purple-500/30 selection:text-purple-200">
        <Navbar />
        <Hero />
        <div className="space-y-0">
          <TechStack />
          <ProblemSolution />
        </div>
        <Portfolio />
        <Services />
        <Contact />
        <Footer />
      </main>
    </Providers>
  );
}
