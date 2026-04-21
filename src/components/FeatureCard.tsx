import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: Props) {
  return (
    <div className="bg-surface rounded-xl p-8 hover:-translate-y-1 hover:shadow-card transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-[rgba(212,168,83,0.12)] flex items-center justify-center mb-5 group-hover:bg-[rgba(212,168,83,0.18)] transition-colors">
        <Icon className="w-5 h-5 text-soft-amber" />
      </div>
      <h3 className="text-lg font-medium text-[#F5F5F0] tracking-tight">{title}</h3>
      <p className="text-sm text-[rgba(245,245,240,0.55)] mt-3 leading-relaxed">{description}</p>
    </div>
  );
}
