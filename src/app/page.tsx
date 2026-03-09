import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { SelectedWorks } from '@/components/SelectedWorks';
import { Expertise } from '@/components/Expertise';
import { Contact } from '@/components/Contact';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <SelectedWorks />
      <Expertise />
      <Contact />
    </main>
  );
}
