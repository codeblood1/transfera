import { useEffect, useRef } from 'react';
import { Zap, ShieldCheck, Globe, TrendingUp, Smartphone, Clock } from 'lucide-react';
import FeatureCard from '@/components/FeatureCard';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Zap, title: 'Instant Transfers', description: 'Send money in minutes, not days. Real-time processing ensures your funds arrive when they\'re needed.' },
  { icon: ShieldCheck, title: 'Bank-Level Security', description: '256-bit AES encryption, biometric authentication, and fraud monitoring protect every transaction.' },
  { icon: Globe, title: '150+ Countries', description: 'Send to bank accounts, mobile wallets, and cash pickup locations across six continents.' },
  { icon: TrendingUp, title: 'Best Exchange Rates', description: 'Our rate-lock feature guarantees the exchange rate you see is the rate you get. No surprises.' },
  { icon: Smartphone, title: 'Mobile First', description: 'Send money, track transfers, and manage your account from any device, anywhere.' },
  { icon: Clock, title: '24/7 Support', description: 'Our multilingual support team is available around the clock to help with any question.' },
];

export default function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.feature-card');
    gsap.fromTo(cards, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', toggleActions: 'play none none none' },
    });
    return () => { ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <section id="features" className="section-padding pt-48 bg-deep-blue" ref={sectionRef}>
      <div className="content-max container-padding">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-soft-amber">Features</p>
          <h2 className="text-[clamp(36px,4vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0] mt-4">
            Everything you need to send money globally
          </h2>
          <p className="text-base text-[rgba(245,245,240,0.55)] mt-4">
            From real-time tracking to bank-grade encryption, every feature is designed for peace of mind.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1080px] mx-auto">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <FeatureCard icon={f.icon} title={f.title} description={f.description} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
