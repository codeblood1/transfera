import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getAccount, getTransferById } from '@/lib/database';
import TransferStatusBadge from '@/components/TransferStatusBadge';
import { ArrowLeft, Clock, User, Globe, CreditCard, Hash, Calendar, Printer } from 'lucide-react';
import type { Transfer } from '@/types';

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function generateReceiptHTML(transfer: Transfer, senderName: string, senderAccount: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Transfer Receipt - ${transfer.reference_code}</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px; }
    .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { text-align: center; border-bottom: 2px solid #D4A853; padding-bottom: 24px; margin-bottom: 24px; }
    .header h1 { color: #0C1222; font-size: 24px; margin: 0 0 8px; }
    .header p { color: #666; font-size: 14px; margin: 0; }
    .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status.pending { background: #fef3c7; color: #92400e; }
    .status.completed { background: #d1fae5; color: #065f46; }
    .status.rejected { background: #fee2e2; color: #991b1b; }
    .row { display: flex; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid #f0f0f0; }
    .row:last-child { border-bottom: none; }
    .label { color: #888; font-size: 13px; }
    .value { color: #0C1222; font-size: 14px; font-weight: 500; }
    .amount { font-size: 28px; font-weight: 700; color: #0C1222; text-align: center; margin: 24px 0; }
    .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    .logo { width: 48px; height: 48px; background: #D4A853; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    @media print { body { background: white; padding: 0; } .receipt { box-shadow: none; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0C1222" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></div>
      <h1>Transfer Receipt</h1>
      <p>Transfera Banking &middot; ${transfer.reference_code}</p>
    </div>
    <div style="text-align:center;margin:16px 0;">
      <span class="status ${transfer.status}">${transfer.status}</span>
    </div>
    <div class="amount">${formatCurrency(transfer.amount, transfer.currency)}</div>
    <div class="row"><span class="label">Reference Code</span><span class="value">${transfer.reference_code}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${new Date(transfer.created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
    <div class="row"><span class="label">Sender</span><span class="value">${senderName} &middot; ${senderAccount}</span></div>
    <div class="row"><span class="label">Recipient</span><span class="value">${transfer.recipient_name}</span></div>
    <div class="row"><span class="label">Recipient Country</span><span class="value">${transfer.recipient_country}</span></div>
    <div class="row"><span class="label">Account Number</span><span class="value">${transfer.recipient_account_number || 'N/A'}</span></div>
    <div class="row"><span class="label">Delivery Method</span><span class="value">${transfer.recipient_type.replace('_', ' ')}</span></div>
    <div class="row"><span class="label">Currency</span><span class="value">${transfer.currency}</span></div>
    <div class="row"><span class="label">Exchange Rate</span><span class="value">${transfer.exchange_rate ? `1 ${transfer.currency} = ${transfer.exchange_rate} ${transfer.recipient_currency}` : 'N/A'}</span></div>
    <div class="row"><span class="label">Fee</span><span class="value">${transfer.fee > 0 ? formatCurrency(transfer.fee, transfer.currency) : 'Free'}</span></div>
    <div class="row"><span class="label">Description</span><span class="value">${transfer.description || '-'}</span></div>
    <div class="footer">
      <p>Thank you for using Transfera</p>
      <p style="margin-top:4px;">Questions? Contact support@transfera.com</p>
    </div>
  </div>
</body>
</html>`;
}

function openReceipt(transfer: Transfer, senderName: string, senderAccount: string) {
  const html = generateReceiptHTML(transfer, senderName, senderAccount);
  const w = window.open('', '_blank', 'width=700,height=800');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

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
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const senderName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
                  openReceipt(transfer, senderName, account.account_number);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-soft-amber/10 text-soft-amber text-xs font-medium hover:bg-soft-amber/20 transition-all"
              >
                <Printer className="w-3.5 h-3.5" /> Receipt
              </button>
              <span className="font-mono text-sm text-[rgba(245,245,240,0.35)]">{transfer.reference_code}</span>
            </div>
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
