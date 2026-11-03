import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import SoftwareLabsHeader from "@/components/SoftwareLabsHeader";
import AcapellaPromo from "@/components/AcapellaPromo";
import ApexPromo from "@/components/ApexPromo";
import ArcoMaestroPromo from "@/components/ArcoMaestroPromo";
import { Services } from "@/components/Services";
import { ProblemSolution } from "@/components/ProblemSolution";
import ChatbotPromo from "@/components/ChatbotPromo";
import { TechStack } from "@/components/TechStack";
import { Portfolio } from "@/components/Portfolio";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import Providers from "./providers";

export default function Home() {
  return (
    <Providers>
      <main className="bg-black min-h-screen text-white selection:bg-purple-500/30 selection:text-purple-200">
        <Navbar />
        <Hero />
        
        {/* Proprietary Software Labs */}
        <SoftwareLabsHeader />
        <AcapellaPromo />
        <ApexPromo />
        <ArcoMaestroPromo />

        {/* Agency Services */}
        <Services />

        {/* Problem vs Solution: The Loya Advantage */}
        <ProblemSolution />

        {/* AI Sales Agent Showcase */}
        <ChatbotPromo />

        {/* Silicon Valley-Grade Tech Stack */}
        <TechStack />

        {/* Client Case Studies & Portfolio */}
        <Portfolio />

        {/* Conversion & Contact */}
        <Contact />

        <Footer />
      </main>
    </Providers>
  );
}
