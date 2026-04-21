import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface CTASectionProps {
  onOpenSignup?: () => void;
}

export default function CTASection({ onOpenSignup }: CTASectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const els = sectionRef.current.querySelectorAll('.cta-animate');
    gsap.fromTo(els, { y: 30, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
    });
  }, []);

  return (
    <section ref={sectionRef} className="py-[clamp(80px,12vh,160px)] bg-surface">
      <div className="content-max container-padding text-center max-w-2xl mx-auto">
        <h2 className="cta-animate text-[clamp(36px,5vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0]">
          Ready to send money?
        </h2>
        <p className="cta-animate text-base text-[rgba(245,245,240,0.55)] mt-4">
          Join 2 million people who trust Transfera for fast, secure international transfers.
        </p>
        <div className="cta-animate mt-8">
          <button
            onClick={onOpenSignup}
            className="inline-block px-8 py-4 rounded-full bg-soft-amber text-deep-blue font-semibold hover:shadow-glow transition-all hover:-translate-y-0.5"
          >
            Create Free Account
          </button>
        </div>
        <p className="cta-animate text-sm text-[rgba(245,245,240,0.45)] mt-4">
          No fees to open. No minimum balance.
        </p>
      </div>
    </section>
  );
}
