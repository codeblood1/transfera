interface Props {
  quote: string;
  name: string;
  role: string;
  initial: string;
}

export default function TestimonialCard({ quote, name, role, initial }: Props) {
  return (
    <div className="bg-surface rounded-xl p-8 hover:-translate-y-1 hover:shadow-card transition-all duration-300">
      <span className="text-soft-amber text-3xl font-serif leading-none">&ldquo;</span>
      <p className="text-[#F5F5F0] italic leading-relaxed mt-2">{quote}</p>
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
        <div className="w-9 h-9 rounded-full bg-soft-amber/20 flex items-center justify-center">
          <span className="text-sm font-semibold text-soft-amber">{initial}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-[#F5F5F0]">{name}</p>
          <p className="text-xs text-[rgba(245,245,240,0.45)]">{role}</p>
        </div>
      </div>
    </div>
  );
}
