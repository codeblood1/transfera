import { Link } from 'react-router';
import TransferStatusBadge from './TransferStatusBadge';
import type { Transfer } from '@/types';

interface Props {
  transfer: Transfer;
  showCancel?: boolean;
  onCancel?: (id: string) => void;
}

export default function TransferRow({ transfer, showCancel, onCancel }: Props) {
  const date = new Date(transfer.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between bg-surface hover:bg-surface-light rounded-lg px-5 py-4 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#F5F5F0] truncate">{transfer.recipient_name}</p>
        <p className="text-xs text-[rgba(245,245,240,0.45)] font-mono mt-0.5">{transfer.reference_code}</p>
      </div>
      <div className="text-right mr-4 hidden sm:block">
        <p className="text-sm font-mono text-[#F5F5F0]">
          {transfer.currency} {transfer.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-[rgba(245,245,240,0.45)]">{date}</p>
      </div>
      <div className="flex items-center gap-3">
        <TransferStatusBadge status={transfer.status} />
        {showCancel && transfer.status === 'pending' && onCancel && (
          <button
            onClick={() => onCancel(transfer.id)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <Link to={`/transfers/${transfer.id}`} className="text-xs text-soft-amber hover:text-[#F5F5F0] transition-colors">
          Details
        </Link>
      </div>
    </div>
  );
}
