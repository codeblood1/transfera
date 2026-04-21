import { useEffect, useRef } from 'react';
import { Lock, Fingerprint, FileCheck, EyeOff } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Lock, title: 'End-to-End Encryption', description: "Every transaction is encrypted with 256-bit AES, the same standard used by the world's leading banks. Your data never touches our servers in plaintext." },
  { icon: Fingerprint, title: 'Biometric Authentication', description: 'Optional biometric login adds a second layer of protection. Face ID, Touch ID, and hardware security keys are all supported.' },
  { icon: FileCheck, title: 'Regulatory Compliance', description: 'Licensed and regulated in the US (FinCEN), UK (FCA), and EU (ECB). Full AML and KYC compliance on every transaction.' },
  { icon: EyeOff, title: 'Privacy First', description: 'We never sell your data. Transaction histories are encrypted at rest and access is strictly need-to-know within our organization.' },
];

export default function SecuritySection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const leftItems = sectionRef.current.querySelectorAll('.sec-left');
    const rightItems = sectionRef.current.querySelectorAll('.sec-right');
    gsap.fromTo(leftItems, { x: -30, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
    });
    gsap.fromTo(rightItems, { x: 30, opacity: 0 }, {
      x: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' },
    });
  }, []);

  return (
    <section id="security" ref={sectionRef} className="section-padding bg-surface">
      <div className="content-max container-padding">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-soft-amber">Security</p>
          <h2 className="text-[clamp(36px,4vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0] mt-4">
            Your money, <em className="font-serif italic text-soft-amber">protected</em>
          </h2>
          <p className="text-base text-[rgba(245,245,240,0.55)] mt-4">
            Multi-layered security infrastructure meets regulatory compliance across every jurisdiction we operate in.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[960px] mx-auto">
          {features.map((f, i) => (
            <div key={i} className={`${i % 2 === 0 ? 'sec-left' : 'sec-right'} bg-glass rounded-xl p-8 border border-[rgba(245,245,240,0.06)]`}>
              <div className="w-12 h-12 rounded-xl bg-[rgba(212,168,83,0.12)] flex items-center justify-center mb-5">
                <f.icon className="w-5 h-5 text-soft-amber" />
              </div>
              <h3 className="text-xl font-medium text-[#F5F5F0] tracking-tight">{f.title}</h3>
              <p className="text-sm text-[rgba(245,245,240,0.55)] mt-3 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
