interface Props {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-[rgba(212,168,83,0.15)]', text: 'text-soft-amber', label: 'Pending' },
  approved: { bg: 'bg-[rgba(74,222,128,0.15)]', text: 'text-emerald-400', label: 'Approved' },
  completed: { bg: 'bg-[rgba(74,222,128,0.15)]', text: 'text-emerald-400', label: 'Completed' },
  rejected: { bg: 'bg-[rgba(239,68,68,0.15)]', text: 'text-red-400', label: 'Rejected' },
  failed: { bg: 'bg-[rgba(239,68,68,0.15)]', text: 'text-red-400', label: 'Failed' },
};

export default function TransferStatusBadge({ status, size = 'sm' }: Props) {
  const config = statusConfig[status] || statusConfig.pending;
  const sizeClasses = {
    sm: 'px-3 py-1 text-[11px]',
    md: 'px-4 py-1.5 text-xs',
    lg: 'px-5 py-2 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium tracking-wide uppercase ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
}
