import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getAccount, getTransferById } from '@/lib/database';
import TransferStatusBadge from '@/components/TransferStatusBadge';
import { ArrowLeft, Clock, User, Globe, CreditCard, Hash, Calendar } from 'lucide-react';

export default function TransferDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: account } = useQuery({
    queryKey: ['account', user?.id],
    queryFn: () => getAccount(user!.id),
    enabled: !!user,
  });

  const { data: transfer } = useQuery({
    queryKey: ['transfer', id],
    queryFn: () => getTransferById(id!, account!.id),
    enabled: !!account && !!id,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-deep-blue flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-soft-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !account || !transfer) return null;

  const steps = [
    { label: 'Created', done: true, date: new Date(transfer.created_at).toLocaleDateString() },
    { label: 'Pending', done: transfer.status !== 'pending', active: transfer.status === 'pending' },
    { label: transfer.status === 'rejected' || transfer.status === 'failed' ? transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1) : 'Completed', done: transfer.status === 'completed' || transfer.status === 'approved', active: transfer.status === 'approved' },
  ];

  return (
    <div className="min-h-screen bg-deep-blue pt-24 pb-16">
      <div className="content-max container-padding max-w-3xl mx-auto">
        <Link to="/transfers" className="inline-flex items-center gap-2 text-sm text-soft-amber hover:text-[#F5F5F0] transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to transfers
        </Link>

        <h1 className="text-[clamp(36px,4vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0]">
          Transfer Details
        </h1>

        <div className="bg-surface rounded-2xl p-8 mt-8 border border-white/5">
          {/* Status header */}
          <div className="flex items-center justify-between mb-6">
            <TransferStatusBadge status={transfer.status} size="md" />
            <span className="font-mono text-sm text-[rgba(245,245,240,0.35)]">{transfer.reference_code}</span>
          </div>

          {/* Amount */}
          <div className="mb-8">
            <p className="text-xs font-medium tracking-wide uppercase text-[rgba(245,245,240,0.35)]">Amount Sent</p>
            <p className="text-[clamp(28px,3vw,44px)] font-mono font-medium text-[#F5F5F0] mt-1">
              {transfer.currency} {transfer.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Status Timeline */}
          <div className="mb-8">
            <div className="flex items-center gap-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      step.done ? 'bg-emerald-500/20 text-emerald-400' :
                      step.active ? 'bg-soft-amber/20 text-soft-amber' :
                      'bg-white/5 text-[rgba(245,245,240,0.35)]'
                    }`}>
                      {step.done ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs mt-2 ${step.active ? 'text-soft-amber font-medium' : step.done ? 'text-emerald-400' : 'text-[rgba(245,245,240,0.35)]'}`}>
                      {step.label}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-2 ${step.done ? 'bg-emerald-500/30' : 'bg-white/10'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recipient Details */}
          <div className="border-t border-white/10 pt-6 mb-6">
            <h3 className="text-lg font-medium text-[#F5F5F0] mb-4">Recipient</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-[rgba(245,245,240,0.35)] mt-0.5" />
                <div>
                  <p className="text-xs text-[rgba(245,245,240,0.35)]">Name</p>
                  <p className="text-sm text-[#F5F5F0]">{transfer.recipient_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="w-4 h-4 text-[rgba(245,245,240,0.35)] mt-0.5" />
                <div>
                  <p className="text-xs text-[rgba(245,245,240,0.35)]">Account</p>
                  <p className="text-sm text-[#F5F5F0] font-mono">{transfer.recipient_account_number || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-[rgba(245,245,240,0.35)] mt-0.5" />
                <div>
                  <p className="text-xs text-[rgba(245,245,240,0.35)]">Country</p>
                  <p className="text-sm text-[#F5F5F0]">{transfer.recipient_country}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 text-[rgba(245,245,240,0.35)] mt-0.5" />
                <div>
                  <p className="text-xs text-[rgba(245,245,240,0.35)]">Delivery Method</p>
                  <p className="text-sm text-[#F5F5F0]">{transfer.recipient_type.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Details */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-medium text-[#F5F5F0] mb-4">Transfer Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 text-[rgba(245,245,240,0.35)] mt-0.5" />
                <div>
                  <p className="text-xs text-[rgba(245,245,240,0.35)]">Reference Code</p>
                  <p className="text-sm text-[#F5F5F0] font-mono">{transfer.reference_code}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[rgba(245,245,240,0.35)] mt-0.5" />
                <div>
                  <p className="text-xs text-[rgba(245,245,240,0.35)]">Exchange Rate</p>
                  <p className="text-sm text-[#F5F5F0] font-mono">
                    1 {transfer.currency} = {transfer.exchange_rate?.toFixed(4) || '--'} {transfer.recipient_currency}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[rgba(245,245,240,0.35)] mt-0.5" />
                <div>
                  <p className="text-xs text-[rgba(245,245,240,0.35)]">Date Created</p>
                  <p className="text-sm text-[#F5F5F0]">
                    {new Date(transfer.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              {transfer.fee > 0 && (
                <div className="flex items-start gap-3">
                  <CreditCard className="w-4 h-4 text-[rgba(245,245,240,0.35)] mt-0.5" />
                  <div>
                    <p className="text-xs text-[rgba(245,245,240,0.35)]">Fee</p>
                    <p className="text-sm text-[#F5F5F0] font-mono">{transfer.currency} {transfer.fee.toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {transfer.rejection_reason && (
            <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">Reason: {transfer.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
