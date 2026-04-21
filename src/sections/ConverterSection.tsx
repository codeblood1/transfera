import { useState, useEffect, useRef } from 'react';
import { ArrowUpDown, RefreshCw } from 'lucide-react';
import { calculateExchange } from '@/lib/database';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ConverterSectionProps {
  onOpenSignup?: () => void;
}

export default function ConverterSection({ onOpenSignup }: ConverterSectionProps) {
  const [calc, setCalc] = useState<{ converted_amount: number; fee: number; exchange_rate: number } | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    calculateExchange('USD', 'EUR', 1000).then(setCalc).catch(() =>
      setCalc({ converted_amount: 920, fee: 0, exchange_rate: 0.92 })
    );
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const el = sectionRef.current.querySelector('.converter-card');
    if (el) {
      gsap.fromTo(el, { scale: 0.95, opacity: 0 }, {
        scale: 1, opacity: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
      });
    }
  }, []);

  return (
    <section ref={sectionRef} className="section-padding bg-surface">
      <div className="content-max container-padding">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-soft-amber">Exchange Rates</p>
          <h2 className="text-[clamp(36px,4vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0] mt-4">
            See how much they'll receive
          </h2>
          <p className="text-base text-[rgba(245,245,240,0.55)] mt-3">Transparent rates. Zero hidden fees.</p>
        </div>

        <div className="converter-card max-w-[560px] mx-auto bg-glass rounded-3xl p-8 border border-[rgba(245,245,240,0.08)]">
          {/* You send */}
          <div className="flex items-center justify-between bg-surface rounded-lg px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🇺🇸</span>
              <span className="font-mono text-sm text-[#F5F5F0] font-medium">USD</span>
            </div>
            <span className="font-mono text-2xl text-[#F5F5F0]">1,000.00</span>
          </div>

          {/* Exchange rate */}
          <div className="flex items-center justify-center gap-2 my-4">
            <span className="text-sm text-[rgba(245,245,240,0.45)]">
              1 USD = {calc ? calc.exchange_rate.toFixed(2) : '0.92'} EUR
            </span>
            <RefreshCw className="w-4 h-4 text-soft-amber" />
          </div>

          {/* Swap icon */}
          <div className="flex justify-center -my-2 relative z-10">
            <div className="w-10 h-10 rounded-full bg-deep-blue border border-[rgba(245,245,240,0.1)] flex items-center justify-center hover:rotate-180 transition-transform duration-300 cursor-pointer">
              <ArrowUpDown className="w-4 h-4 text-soft-amber" />
            </div>
          </div>

          {/* They receive */}
          <div className="flex items-center justify-between bg-surface rounded-lg px-5 py-4 mt-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">🇪🇺</span>
              <span className="font-mono text-sm text-[#F5F5F0] font-medium">EUR</span>
            </div>
            <span className="font-mono text-2xl text-[#F5F5F0]">
              {calc ? calc.converted_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '920.00'}
            </span>
          </div>

          {/* Fee & Delivery */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-[rgba(245,245,240,0.45)]">Transfer fee</span>
            <span className="text-sm font-medium text-emerald-400">${calc ? calc.fee.toFixed(2) : '0.00'}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-[rgba(245,245,240,0.45)]">Delivery time</span>
            <span className="text-sm text-[#F5F5F0]">Within minutes</span>
          </div>

          {/* CTA */}
          <button
            onClick={onOpenSignup}
            className="w-full mt-6 py-4 rounded-lg bg-soft-amber text-deep-blue font-semibold hover:shadow-glow transition-all hover:-translate-y-0.5"
          >
            Send Money
          </button>
        </div>
      </div>
    </section>
  );
}
