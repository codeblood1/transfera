import { useEffect, useRef, useState } from 'react';
import { ChevronDown, MessageCircle, Phone, Mail, HelpCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  { question: 'How long do transfers take?', answer: 'Most transfers are completed within minutes after admin approval. Bank deposits may take 1-2 business days depending on the receiving bank and country.' },
  { question: 'What are the transfer fees?', answer: 'Transfera charges zero fees for standard transfers. For currency conversions, a small fee of 0.5% to 1% applies depending on the destination country.' },
  { question: 'How do I add money to my account?', answer: 'Use the "Add Funds" button in your dashboard. You\'ll receive wire transfer instructions with your unique account number. Funds are credited after admin verification.' },
  { question: 'Is my money safe?', answer: 'Yes. We use 256-bit AES encryption, bank-grade security infrastructure, and all transfers require admin approval before funds move. Your balance is never at risk from unauthorized transactions.' },
  { question: 'Can I cancel a pending transfer?', answer: 'Yes. If your transfer status is still "Pending", you can cancel it from the Transfers page. Once approved, the transfer cannot be reversed.' },
  { question: 'What countries can I send to?', answer: 'We currently support 15 countries including the US, UK, EU, Nigeria, India, Brazil, Ghana, Kenya, Philippines, Mexico, South Africa, Australia, Canada, Japan, and Singapore.' },
];

export default function SupportSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!sectionRef.current) return;
    const cards = sectionRef.current.querySelectorAll('.support-animate');
    gsap.fromTo(cards, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' },
    });
  }, []);

  return (
    <section id="support" ref={sectionRef} className="section-padding bg-deep-blue">
      <div className="content-max container-padding">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-medium tracking-[0.12em] uppercase text-soft-amber">Support</p>
          <h2 className="text-[clamp(36px,4vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0] mt-4">
            We're here to <em className="font-serif italic text-soft-amber">help</em>
          </h2>
          <p className="text-base text-[rgba(245,245,240,0.55)] mt-4">
            Find answers to common questions or reach out to our support team directly.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-[800px] mx-auto mb-14">
          {[
            { icon: MessageCircle, title: 'Live Chat', desc: 'Available 24/7', color: '#4ADE80' },
            { icon: Phone, title: 'Phone Support', desc: '+1 (800) 555-0199', color: '#60A5FA' },
            { icon: Mail, title: 'Email Us', desc: 'support@transfera.com', color: '#D4A853' },
          ].map((item, i) => (
            <div key={i} className="support-animate bg-surface rounded-xl p-6 border border-[rgba(245,245,240,0.06)] hover:border-soft-amber/20 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h3 className="text-sm font-medium text-[#F5F5F0]">{item.title}</h3>
              <p className="text-xs text-[rgba(245,245,240,0.45)] mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-soft-amber" />
            <h3 className="text-lg font-medium text-[#F5F5F0]">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="support-animate bg-surface rounded-xl border border-[rgba(245,245,240,0.06)] overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-medium text-[#F5F5F0] pr-4">{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-soft-amber shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`} />
                </button>
                {openIndex === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-[rgba(245,245,240,0.55)] leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
