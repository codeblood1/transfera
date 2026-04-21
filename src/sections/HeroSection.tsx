import { useEffect, useRef } from 'react';
import { Play, Globe, Users, MapPin, Shield } from 'lucide-react';
import gsap from 'gsap';

interface HeroSectionProps {
  onOpenSignup?: () => void;
}

export default function HeroSection({ onOpenSignup }: HeroSectionProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated particle canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      context!.clearRect(0, 0, w, h);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        context!.beginPath();
        context!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        context!.fillStyle = `rgba(212, 168, 83, ${p.alpha})`;
        context!.fill();
      });

      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            context!.beginPath();
            context!.moveTo(p1.x, p1.y);
            context!.lineTo(p2.x, p2.y);
            context!.strokeStyle = `rgba(212, 168, 83, ${0.08 * (1 - dist / 150)})`;
            context!.lineWidth = 0.5;
            context!.stroke();
          }
        });
      });
    }
    animate();

    const handleResize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!textRef.current) return;
    const els = textRef.current.querySelectorAll('.animate-in');
    gsap.fromTo(els, { y: 30, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power3.out', delay: 0.3,
    });
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 z-0" style={{
        background: 'radial-gradient(ellipse at 30% 50%, #1a2744 0%, #0C1222 50%, #080e1a 100%)',
      }} />
      <div className="absolute inset-0 z-0 opacity-30" style={{
        background: 'radial-gradient(circle at 70% 30%, rgba(212,168,83,0.12) 0%, transparent 50%)',
      }} />
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
      />

      {/* Glass card decorative element */}
      <div className="absolute right-[10%] top-1/2 -translate-y-1/2 z-[2] hidden lg:block">
        <div className="relative w-[340px] h-[220px]" style={{ perspective: '1000px' }}>
          <div className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(27,33,50,0.8) 0%, rgba(12,18,34,0.9) 100%)',
              border: '1px solid rgba(245,245,240,0.1)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
              transform: 'rotateY(-15deg) rotateX(5deg)',
            }}>
            {/* Card content */}
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-soft-amber/90 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0C1222" strokeWidth="3"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                </div>
                <span className="font-mono text-xs text-[rgba(245,245,240,0.4)]">DEBIT</span>
              </div>
              <div>
                <div className="flex gap-3 mb-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="font-mono text-lg text-[rgba(245,245,240,0.8)] tracking-widest">****</div>
                  ))}
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-[rgba(245,245,240,0.35)] uppercase tracking-wider">Card Holder</p>
                    <p className="text-sm text-[rgba(245,245,240,0.7)] mt-0.5">TRANSFERA USER</p>
                  </div>
                  <div className="w-12 h-8 rounded bg-gradient-to-r from-yellow-600/30 to-yellow-400/20" />
                </div>
              </div>
            </div>
            {/* Shimmer band */}
            <div className="absolute top-[35%] left-0 right-0 h-10"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(192,200,216,0.08) 30%, rgba(192,200,216,0.15) 50%, rgba(192,200,216,0.08) 70%, transparent 100%)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Text content */}
      <div className="relative z-10 w-full content-max container-padding py-32">
        <div className="max-w-xl" ref={textRef}>
          <p className="animate-in text-xs font-medium tracking-[0.12em] uppercase text-soft-amber mb-6">
            International Transfers
          </p>
          <h1 className="animate-in text-[clamp(42px,6vw,84px)] font-medium leading-[0.92] tracking-[-0.03em] text-[#F5F5F0]">
            Send money{' '}
            <em className="font-serif italic text-soft-amber">securely</em>, anywhere in the world
          </h1>
          <p className="animate-in text-base text-[rgba(245,245,240,0.55)] mt-6 max-w-[480px] leading-relaxed">
            Bank-level security. Competitive rates. 150+ countries. No hidden fees.
          </p>
          <div className="animate-in flex items-center gap-4 mt-8">
            <button
              onClick={onOpenSignup}
              className="px-7 py-3.5 rounded-full bg-soft-amber text-deep-blue font-semibold hover:shadow-glow transition-all hover:-translate-y-0.5"
            >
              Get Started
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full border border-[rgba(245,245,240,0.2)] text-[#F5F5F0] hover:bg-white/5 transition-all"
            >
              <Play className="w-4 h-4" /> Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar overlapping bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-1/2">
        <div className="content-max container-padding">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Globe, value: '$10B+', label: 'TRANSFERRED' },
              { icon: Users, value: '2M+', label: 'ACTIVE USERS' },
              { icon: MapPin, value: '150+', label: 'COUNTRIES' },
              { icon: Shield, value: '99.9%', label: 'UPTIME' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface rounded-xl px-5 py-5 border border-white/5 text-center">
                <div className="w-10 h-10 rounded-full bg-soft-amber/20 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-5 h-5 text-soft-amber" />
                </div>
                <p className="text-2xl md:text-3xl font-mono font-medium text-[#F5F5F0]">{stat.value}</p>
                <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[rgba(245,245,240,0.45)] mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
