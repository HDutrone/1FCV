import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { StatsBar } from '@/components/StatsBar';
import { ModulesSection } from '@/components/ModulesSection';
import { WorkflowSection } from '@/components/WorkflowSection';
import { CtaSection } from '@/components/CtaSection';
import { Footer } from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <ModulesSection />
        <WorkflowSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
