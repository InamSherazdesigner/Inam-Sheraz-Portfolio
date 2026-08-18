import type { Metadata } from 'next';
import HeroSection from '@/components/HeroSection';

export const metadata: Metadata = {
  title: 'Hero Section Staging Preview',
  robots: { index: false, follow: false },
};

export default function TestHeroPage() {
  return (
    <main style={{ backgroundColor: '#0d0d0d', minHeight: '100vh' }}>
      <HeroSection />
    </main>
  );
}
