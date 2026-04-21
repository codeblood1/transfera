import { useEffect, useRef, useState } from 'react';
import { getCountries } from '@/lib/database';
import type { Country } from '@/types';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const fallbackCountries: Country[] = [
  { code: 'US', name: 'United States', currency_code: 'USD', currency_name: 'US Dollar', flag_emoji: '🇺🇸', delivery_methods: ['bank_deposit', 'card_transfer'], is_active: true },
  { code: 'GB', name: 'United Kingdom', currency_code: 'GBP', currency_name: 'British Pound', flag_emoji: '🇬🇧', delivery_methods: ['bank_deposit', 'mobile_wallet'], is_active: true },
  { code: 'EU', name: 'European Union', currency_code: 'EUR', currency_name: 'Euro', flag_emoji: '🇪🇺', delivery_methods: ['bank_deposit', 'mobile_wallet'], is_active: true },
  { code: 'NG', name: 'Nigeria', currency_code: 'NGN', currency_name: 'Nigerian Naira', flag_emoji: '🇳🇬', delivery_methods: ['bank_deposit', 'mobile_wallet', 'cash_pickup'], is_active: true },
  { code: 'IN', name: 'India', currency_code: 'INR', currency_name: 'Indian Rupee', flag_emoji: '🇮🇳', delivery_methods: ['bank_deposit', 'mobile_wallet'], is_active: true },
  { code: 'BR', name: 'Brazil', currency_code: 'BRL', currency_name: 'Brazilian Real', flag_emoji: '🇧🇷', delivery_methods: ['bank_deposit'], is_active: true },
  { code: 'GH', name: 'Ghana', currency_code: 'GHS', currency_name: 'Ghana Cedi', flag_emoji: '🇬🇭', delivery_methods: ['mobile_wallet', 'cash_pickup'], is_active: true },
  { code: 'KE', name: 'Kenya', currency_code: 'KES', currency_name: 'Kenyan Shilling', flag_emoji: '🇰🇪', delivery_methods: ['mobile_wallet', 'cash_pickup'], is_active: true },
];

export default function DestinationsSection() {
  const [countries, setCountries] = useState<Country[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCountries().then(data => {
      setCountries(data.length >= 8 ? data.slice(0, 8) : fallbackCountries);
    }).catch(() => setCountries(fallbackCountries));
  }, []);

  useEffect(() => {
    if (!sectionRef.current || countries.length === 0) return;
    const cards = sectionRef.current.querySelectorAll('.dest-card');
    gsap.fromTo(cards, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
    });
  }, [countries]);

  const methodLabels: Record<string, string> = {
    bank_deposit: 'Bank',
    mobile_wallet: 'Wallet',
    cash_pickup: 'Cash',
    card_transfer: 'Card',
  };

  return (
    <section id="destinations" ref={sectionRef} className="section-padding bg-deep-blue">
      <div className="content-max container-padding">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-soft-amber">Destinations</p>
          <h2 className="text-[clamp(36px,4vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0] mt-4">
            Send money to{' '}
            <em className="font-serif italic text-soft-amber">anywhere</em>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-[1080px] mx-auto">
          {countries.map((c, i) => (
            <div key={i} className="dest-card bg-surface rounded-xl p-6 hover:-translate-y-1 hover:shadow-card transition-all duration-300 cursor-default">
              <span className="text-3xl">{c.flag_emoji}</span>
              <h3 className="text-lg font-medium text-[#F5F5F0] mt-3 tracking-tight">{c.name}</h3>
              <p className="text-sm text-[rgba(245,245,240,0.45)] mt-1">{c.currency_code}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {c.delivery_methods.slice(0, 3).map(m => (
                  <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-[rgba(245,245,240,0.06)] text-[rgba(245,245,240,0.55)]">
                    {methodLabels[m] || m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
