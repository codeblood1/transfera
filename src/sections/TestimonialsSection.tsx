import { useEffect, useRef } from 'react';
import TestimonialCard from '@/components/TestimonialCard';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  { quote: 'Transfera saved me hundreds on exchange rates when sending money home to my family. The app is incredibly easy to use and transfers arrive within minutes.', name: 'Sarah M.', role: 'Small Business Owner, London', initial: 'S' },
  { quote: 'As a freelancer working with international clients, I need a reliable way to receive payments. Transfera has been flawless for two years now.', name: 'David K.', role: 'Software Engineer, Berlin', initial: 'D' },
  { quote: 'The security features give me peace of mind. Biometric login, instant notifications, and the ability to freeze my account instantly if needed.', name: 'Aisha T.', role: 'Financial Analyst, New York', initial: 'A' },
];

export default function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.test-card');
    gsap.fromTo(cards, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
    });
  }, []);

  return (
    <section id="testimonials" ref={sectionRef} className="section-padding bg-deep-blue">
      <div className="content-max container-padding">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-soft-amber">Testimonials</p>
          <h2 className="text-[clamp(36px,4vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0] mt-4">
            Trusted by millions worldwide
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1080px] mx-auto">
          {testimonials.map((t, i) => (
            <div key={i} className="test-card">
              <TestimonialCard {...t} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
