import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowUpRight, ArrowDownLeft, Send, Plus, RefreshCw,
  CreditCard, Shield, Globe, ChevronRight, Bell,
  Wallet, Clock, TrendingUp, Filter, Download,
  FileText, X, Eye, EyeOff, Copy, Check,
} from 'lucide-react';
import {
  createTransfer,
  getTransfers,
  getTransactions,
  getCountries,
  calculateExchange,
  subscribeToTransfers,
  subscribeToTransactions,
} from '@/lib/database';
import type { Transfer, Transaction, Country } from '@/types';

interface SavedRecipient {
  name: string;
  initials: string;
  country: string;
  country_code: string;
}

const savedRecipients: SavedRecipient[] = [
  { name: 'Sarah Johnson', initials: 'SJ', country: 'United States', country_code: 'US' },
  { name: 'Marco Rossi', initials: 'MR', country: 'Italy', country_code: 'EU' },
  { name: 'Amara Okafor', initials: 'AO', country: 'Nigeria', country_code: 'NG' },
  { name: 'Priya Sharma', initials: 'PS', country: 'India', country_code: 'IN' },
];

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (days === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Generate a virtual card for the user (deterministic based on account number)
function generateVirtualCard(accountNumber: string) {
  const seed = accountNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const cardNum = `4${String(seed).padStart(3, '0')} ${String((seed * 7) % 10000).padStart(4, '0')} ${String((seed * 13) % 10000).padStart(4, '0')} ${String((seed * 17) % 10000).padStart(4, '0')}`;
  const expiryMonth = String(((seed * 3) % 12) + 1).padStart(2, '0');
  const expiryYear = String(26 + ((seed * 5) % 5));
  const cvv = String((seed * 11) % 1000).padStart(3, '0');
  return { cardNum, expiry: `${expiryMonth}/${expiryYear}`, cvv };
}

// Receipt content generator
function generateReceiptHTML(transfer: Transfer, profileName: string, accountNumber: string): string {
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
    <div class="row"><span class="label">Sender</span><span class="value">${profileName} &middot; ${accountNumber}</span></div>
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

function openReceipt(transfer: Transfer, profileName: string, accountNumber: string) {
  const html = generateReceiptHTML(transfer, profileName, accountNumber);
  const w = window.open('', '_blank', 'width=700,height=800');
  if (w) {
    w.document.write(html);
    w.document.close();
  }
}

export default function Dashboard() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const transferFormRef = useRef<HTMLDivElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'send' | 'request' | 'exchange'>('send');

  // Form state (Send)
  const [recipientName, setRecipientName] = useState('');
  const [country, setCountry] = useState('US');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exchange state
  const [exchangeAmount, setExchangeAmount] = useState('1000');
  const [exchangeFrom, setExchangeFrom] = useState('USD');
  const [exchangeTo, setExchangeTo] = useState('EUR');
  const [exchangeResult, setExchangeResult] = useState<{ original_amount: number; fee: number; exchange_rate: number; converted_amount: number; fee_percentage: number } | null>(null);
  const [exchangeLoading, setExchangeLoading] = useState(false);

  // Data state
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; sub?: string } | null>(null);

  // Modals
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [cardFrozen, setCardFrozen] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!profile?.account?.id) return;
    setIsLoading(true);
    try {
      const [tData, txData, cData] = await Promise.all([
        getTransfers(profile.account.id, undefined, 20),
        getTransactions(profile.account.id, 20),
        getCountries(),
      ]);
      setTransfers(tData);
      setTransactions(txData);
      setCountries(cData);
    } catch {
      // silent fail
    }
    setIsLoading(false);
  }, [profile?.account?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!profile?.account?.id) return;
    const tSub = subscribeToTransfers(profile.account.id, () => {
      fetchData();
      refreshProfile();
    });
    const txSub = subscribeToTransactions(profile.account.id, () => {
      fetchData();
      refreshProfile();
    });
    return () => {
      tSub.unsubscribe();
      txSub.unsubscribe();
    };
  }, [profile?.account?.id, fetchData, refreshProfile]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Exchange calculation
  const handleCalculateExchange = async () => {
    const amt = parseFloat(exchangeAmount);
    if (!amt || amt <= 0) return;
    setExchangeLoading(true);
    try {
      const result = await calculateExchange(exchangeFrom, exchangeTo, amt);
      if (result) {
        setExchangeResult(result);
      } else {
        setToast({ type: 'error', message: 'Exchange rate not available for this pair' });
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to calculate exchange rate' });
    }
    setExchangeLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'exchange') {
      handleCalculateExchange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, exchangeFrom, exchangeTo]);

  // Computed values
  const balance = profile?.account?.balance ?? 0;
  const currency = profile?.account?.currency ?? 'USD';
  const myAccountNumber = profile?.account?.account_number ?? '';
  const pendingAmount = transfers
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount as unknown as string) || 0), 0);
  const pendingCount = transfers.filter(t => t.status === 'pending').length;
  const availableBalance = balance - pendingAmount;

  // Transfer limits — dynamically calculated from actual transfers
  const DAILY_LIMIT = 30000;
  const MONTHLY_LIMIT = 100000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const dailySent = transfers
    .filter(t => {
      const d = new Date(t.created_at);
      return d >= todayStart && (t.status === 'completed' || t.status === 'pending');
    })
    .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);

  const monthlySent = transfers
    .filter(t => {
      const d = new Date(t.created_at);
      return d >= monthStart && (t.status === 'completed' || t.status === 'pending');
    })
    .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);

  const dailyPct = Math.min((dailySent / DAILY_LIMIT) * 100, 100);
  const monthlyPct = Math.min((monthlySent / MONTHLY_LIMIT) * 100, 100);

  // Virtual card
  const virtualCard = generateVirtualCard(myAccountNumber || 'TR00000000');

  // Handle copy to clipboard
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Handle recipient quick select
  const handleSelectRecipient = (r: SavedRecipient) => {
    setRecipientName(r.name);
    setCountry(r.country_code);
    setActiveTab('send');
    transferFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Handle send money transfer
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.account?.id) return;
    const amt = parseFloat(amount);
    if (!recipientName.trim() || !amt || amt <= 0) return;

    setIsSubmitting(true);
    try {
      const selectedCountry = countries.find(c => c.code === country);
      const result = await createTransfer({
        sender_account_id: profile.account.id,
        recipient_type: 'external_bank',
        recipient_name: recipientName.trim(),
        recipient_country: selectedCountry?.code || country,
        amount: amt,
        currency: currency,
        recipient_currency: selectedCountry?.currency_code || currency,
        ...(accountNumber.trim() ? { recipient_account_number: accountNumber.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      if (result) {
        setToast({
          type: 'success',
          message: 'Transfer Initiated Successfully!',
          sub: `Your transfer is pending approval. Reference: ${result.reference_code}`,
        });
        setRecipientName('');
        setCountry('US');
        setAccountNumber('');
        setAmount('');
        setDescription('');
        fetchData();
        refreshProfile();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create transfer. Please try again.';
      setToast({ type: 'error', message: 'Transfer Failed', sub: msg });
    }
    setIsSubmitting(false);
  };

  // Quick Actions handlers
  const scrollToSend = () => {
    setActiveTab('send');
    transferFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const showAddFunds = () => setShowAddFundsModal(true);
  const scrollToExchange = () => {
    setActiveTab('exchange');
    transferFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const showCards = () => setShowCardsModal(true);

  const quickActions = [
    { icon: Send, label: 'Send Money', desc: 'Transfer to anyone', color: '#D4A853', action: scrollToSend },
    { icon: Plus, label: 'Add Funds', desc: 'Top up your account', color: '#4ADE80', action: showAddFunds },
    { icon: RefreshCw, label: 'Exchange', desc: 'Convert currencies', color: '#60A5FA', action: scrollToExchange },
    { icon: CreditCard, label: 'My Cards', desc: 'Manage cards', color: '#A78BFA', action: showCards },
  ];

  const recentTransfersList = transfers.slice(0, 5);
  const recentActivityList = transactions.slice(0, 5);

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-[#0C1222] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#D4A853] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#F5F5F0]/40">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const profileName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user?.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen bg-[#0C1222]">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-[#0C1222]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#D4A853] flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-[#0C1222]" />
              </div>
              <span className="text-lg font-semibold text-[#F5F5F0]">Transfera</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-[#F5F5F0] transition-all">Dashboard</Link>
              <Link to="/transfers" className="px-4 py-2 rounded-lg text-sm font-medium text-[#F5F5F0]/50 hover:text-[#F5F5F0] hover:bg-white/5 transition-all">Transfers</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#F5F5F0]/60 hover:bg-white/10 transition-all">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#D4A853] rounded-full" />}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A853] to-[#B08A3E] flex items-center justify-center">
                <span className="text-sm font-semibold text-[#0C1222]">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[#F5F5F0]">{user?.email?.split('@')[0] || 'User'}</p>
                <button onClick={signOut} className="text-xs text-[#F5F5F0]/40 hover:text-[#D4A853] transition-colors">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Toast */}
        {toast && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <Shield className={`w-4 h-4 ${toast.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <div>
              <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{toast.message}</p>
              {toast.sub && <p className={`text-xs ${toast.type === 'success' ? 'text-emerald-400/60' : 'text-red-400/60'}`}>{toast.sub}</p>}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A853]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-4 h-4 text-[#D4A853]" />
                    <span className="text-xs font-medium text-[#F5F5F0]/50 uppercase tracking-wider">Total Balance</span>
                  </div>
                  <p className="text-3xl font-bold text-[#F5F5F0] font-mono">{formatCurrency(balance, currency)}</p>
                  {pendingAmount > 0 && (
                    <p className="text-xs text-[#F5F5F0]/40 mt-1">
                      Available: <span className="font-mono text-[#D4A853]">{formatCurrency(availableBalance, currency)}</span>
                      <span className="text-[#F5F5F0]/20"> ({formatCurrency(pendingAmount, currency)} pending)</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Active
                    </span>
                    <span className="text-xs text-[#F5F5F0]/30">{profile?.account?.status || 'active'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A853]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-[#D4A853]" />
                    <span className="text-xs font-medium text-[#F5F5F0]/50 uppercase tracking-wider">Pending Approval</span>
                  </div>
                  <p className="text-3xl font-bold text-[#F5F5F0] font-mono">{formatCurrency(pendingAmount, currency)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4A853]/10 text-[#D4A853]">{pendingCount} transfer{pendingCount !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-[#F5F5F0]/30">awaiting approval</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Transfer */}
            <div ref={transferFormRef} className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/5 overflow-hidden">
              <div className="flex border-b border-white/5">
                {[
                  { key: 'send' as const, label: 'Send Money', icon: Send },
                  { key: 'request' as const, label: 'Request', icon: ArrowDownLeft },
                  { key: 'exchange' as const, label: 'Exchange', icon: RefreshCw },
                ].map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setActiveTab(key)} className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === key ? 'text-[#D4A853] border-[#D4A853] bg-[#D4A853]/5' : 'text-[#F5F5F0]/40 border-transparent hover:text-[#F5F5F0]/60 hover:bg-white/5'}`}>
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'send' && (
                  <form onSubmit={handleSend} className="space-y-5">
                    <div>
                      <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-3 block">Quick Select Recipient</label>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {savedRecipients.map((r) => (
                          <button key={r.name} type="button" onClick={() => handleSelectRecipient(r)} className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#D4A853]/30 hover:bg-[#D4A853]/5 transition-all group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A853]/20 to-[#B08A3E]/20 flex items-center justify-center border border-[#D4A853]/20">
                              <span className="text-xs font-semibold text-[#D4A853]">{r.initials}</span>
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-medium text-[#F5F5F0] group-hover:text-[#D4A853] transition-colors">{r.name}</p>
                              <p className="text-xs text-[#F5F5F0]/30">{r.country}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Recipient Name</label>
                        <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Enter full name" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Country</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                          <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#F5F5F0] focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none appearance-none">
                            {countries.length > 0 ? countries.map(c => (<option key={c.code} value={c.code}>{c.name} ({c.currency_code})</option>)) : (<><option value="US">United States (USD)</option><option value="GB">United Kingdom (GBP)</option><option value="EU">European Union (EUR)</option><option value="NG">Nigeria (NGN)</option><option value="IN">India (INR)</option><option value="BR">Brazil (BRL)</option><option value="GH">Ghana (GHS)</option><option value="KE">Kenya (KES)</option></>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Account / Mobile Number</label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account or mobile number" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#D4A853]">$</span>
                          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" min="1" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none font-mono" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Description (Optional)</label>
                      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this transfer for?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none" />
                    </div>

                    {amount && parseFloat(amount) > 0 && (
                      <div className="bg-[#D4A853]/5 border border-[#D4A853]/10 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between"><span className="text-sm text-[#F5F5F0]/50">You send</span><span className="text-sm font-mono font-medium text-[#F5F5F0]">{formatCurrency(parseFloat(amount), currency)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-sm text-[#F5F5F0]/50">Fee</span><span className="text-sm font-mono text-emerald-400">Free</span></div>
                        <div className="border-t border-white/10 pt-3 flex items-center justify-between"><span className="text-sm font-medium text-[#F5F5F0]">Total deducted</span><span className="text-lg font-mono font-bold text-[#D4A853]">{formatCurrency(parseFloat(amount), currency)}</span></div>
                      </div>
                    )}

                    <button type="submit" disabled={isSubmitting || !recipientName.trim() || !amount || parseFloat(amount) <= 0} className="w-full py-4 rounded-xl bg-[#D4A853] text-[#0C1222] font-semibold hover:bg-[#D4A853]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isSubmitting ? (<><div className="w-4 h-4 border-2 border-[#0C1222] border-t-transparent rounded-full animate-spin" />Processing...</>) : (<><Send className="w-4 h-4" /> Initiate Transfer</>)}
                    </button>
                  </form>
                )}

                {activeTab === 'exchange' && (
                  <div className="space-y-5">
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
                      <RefreshCw className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-blue-400 font-medium">Currency Exchange Calculator</p>
                        <p className="text-xs text-blue-400/60 mt-0.5">Check live exchange rates before you send. Rates are locked at the time of transfer.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#D4A853]">$</span>
                          <input type="number" value={exchangeAmount} onChange={(e) => { setExchangeAmount(e.target.value); }} placeholder="0.00" min="1" className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">From</label>
                        <select value={exchangeFrom} onChange={(e) => setExchangeFrom(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none appearance-none">
                          <option value="USD">USD — US Dollar</option>
                          <option value="EUR">EUR — Euro</option>
                          <option value="GBP">GBP — British Pound</option>
                          <option value="NGN">NGN — Nigerian Naira</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">To</label>
                        <select value={exchangeTo} onChange={(e) => setExchangeTo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none appearance-none">
                          <option value="EUR">EUR — Euro</option>
                          <option value="USD">USD — US Dollar</option>
                          <option value="GBP">GBP — British Pound</option>
                          <option value="NGN">NGN — Nigerian Naira</option>
                          <option value="INR">INR — Indian Rupee</option>
                          <option value="BRL">BRL — Brazilian Real</option>
                        </select>
                      </div>
                    </div>

                    <button onClick={handleCalculateExchange} disabled={exchangeLoading} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[#F5F5F0] font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                      {exchangeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {exchangeLoading ? 'Calculating...' : 'Calculate Exchange'}
                    </button>

                    {exchangeResult && (
                      <div className="bg-[#D4A853]/5 border border-[#D4A853]/10 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between"><span className="text-sm text-[#F5F5F0]/50">You send</span><span className="text-sm font-mono font-medium text-[#F5F5F0]">{formatCurrency(exchangeResult.original_amount, exchangeFrom)}</span></div>
                        <div className="flex items-center justify-between"><span className="text-sm text-[#F5F5F0]/50">Exchange rate</span><span className="text-sm font-mono text-[#F5F5F0]/70">1 {exchangeFrom} = {exchangeResult.exchange_rate.toFixed(4)} {exchangeTo}</span></div>
                        <div className="flex items-center justify-between"><span className="text-sm text-[#F5F5F0]/50">Fee ({exchangeResult.fee_percentage}%)</span><span className="text-sm font-mono text-[#F5F5F0]/70">{formatCurrency(exchangeResult.fee, exchangeFrom)}</span></div>
                        <div className="border-t border-white/10 pt-3 flex items-center justify-between"><span className="text-sm font-medium text-[#F5F5F0]">They receive</span><span className="text-lg font-mono font-bold text-[#D4A853]">{formatCurrency(exchangeResult.converted_amount, exchangeTo)}</span></div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'request' && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <ArrowDownLeft className="w-8 h-8 text-[#F5F5F0]/20" />
                    </div>
                    <p className="text-[#F5F5F0]/40 text-sm">Request money feature coming soon</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transfers */}
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-[#D4A853]" />
                  <h3 className="text-lg font-semibold text-[#F5F5F0]">Recent Transfers</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:bg-white/10 transition-all"><Filter className="w-4 h-4" /></button>
                  <button className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:bg-white/10 transition-all"><Download className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {isLoading ? (
                  <div className="p-8 text-center text-[#F5F5F0]/30 text-sm">Loading transfers...</div>
                ) : recentTransfersList.length === 0 ? (
                  <div className="p-8 text-center text-[#F5F5F0]/30 text-sm">No transfers yet. Send your first transfer above.</div>
                ) : (
                  recentTransfersList.map((t) => (
                    <div key={t.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D4A853]/20 to-[#B08A3E]/20 flex items-center justify-center border border-[#D4A853]/20">
                          <span className="text-xs font-semibold text-[#D4A853]">{t.recipient_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#F5F5F0] group-hover:text-[#D4A853] transition-colors">{t.recipient_name}</p>
                          <p className="text-xs text-[#F5F5F0]/40 mt-0.5">{t.recipient_country} &middot; {formatDate(t.created_at)} &middot; {t.reference_code}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-sm font-mono font-medium text-[#F5F5F0]">{formatCurrency(t.amount, t.currency)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'pending' ? 'bg-[#D4A853]/10 text-[#D4A853]' : t.status === 'approved' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                            {t.status === 'completed' ? 'Completed' : t.status === 'pending' ? 'Pending' : t.status === 'approved' ? 'Approved' : 'Rejected'}
                          </span>
                        </div>
                        <button onClick={() => openReceipt(t, profileName, myAccountNumber)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:bg-[#D4A853]/10 hover:text-[#D4A853] transition-all" title="View Receipt">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-semibold text-[#F5F5F0]/60 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map(({ icon: Icon, label, desc, color, action }) => (
                  <button key={label} onClick={action} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-[#F5F5F0] group-hover:text-[#D4A853] transition-colors">{label}</p>
                      <p className="text-xs text-[#F5F5F0]/30">{desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#F5F5F0]/20 group-hover:text-[#D4A853] transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-semibold text-[#F5F5F0]/60 uppercase tracking-wider">Recent Activity</h3>
              </div>
              <div className="p-6 space-y-4">
                {isLoading ? (
                  <div className="text-center text-[#F5F5F0]/30 text-sm py-4">Loading activity...</div>
                ) : recentActivityList.length === 0 ? (
                  <div className="text-center text-[#F5F5F0]/30 text-sm py-4">No activity yet.</div>
                ) : (
                  recentActivityList.map((a) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'credit' ? 'bg-emerald-500/10' : a.type === 'fee' ? 'bg-blue-500/10' : 'bg-[#D4A853]/10'}`}>
                        {a.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : a.type === 'fee' ? <RefreshCw className="w-4 h-4 text-blue-400" /> : <Send className="w-4 h-4 text-[#D4A853]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F5F5F0]">{a.description}</p>
                        <p className="text-xs text-[#F5F5F0]/30 mt-0.5">{formatDate(a.created_at)}</p>
                      </div>
                      <span className={`text-sm font-mono font-medium shrink-0 ${a.type === 'credit' ? 'text-emerald-400' : a.type === 'fee' ? 'text-blue-400' : 'text-[#F5F5F0]'}`}>
                        {a.type === 'credit' ? '+' : '-'}{formatCurrency(a.amount, a.currency).replace('$', '').replace(/[^0-9.,]/g, '')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Transfer Limits */}
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-semibold text-[#F5F5F0]/60 uppercase tracking-wider mb-4">Transfer Limits</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#F5F5F0]/50">Daily ({formatCurrency(dailySent, currency)})</span>
                    <span className="text-[#F5F5F0] font-mono">{formatCurrency(DAILY_LIMIT, currency)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#B08A3E] rounded-full transition-all duration-500" style={{ width: `${dailyPct}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#F5F5F0]/50">Monthly ({formatCurrency(monthlySent, currency)})</span>
                    <span className="text-[#F5F5F0] font-mono">{formatCurrency(MONTHLY_LIMIT, currency)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#B08A3E] rounded-full transition-all duration-500" style={{ width: `${monthlyPct}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-[#14192A] rounded-3xl p-6 border border-emerald-500/10">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-400">Security Status</h3>
              </div>
              <p className="text-sm text-[#F5F5F0]/60 mb-3">Your account is secured with email authentication.</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddFundsModal(false)}>
          <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/10 p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-[#F5F5F0] mb-2">Add Funds</h3>
            <p className="text-sm text-[#F5F5F0]/50 mb-6">To add funds, send a wire transfer to your account number below. Funds are credited after admin verification.</p>
            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-6">
              <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Your Account Number</label>
              <div className="flex items-center gap-3">
                <code className="text-2xl font-mono font-bold text-[#D4A853] tracking-wider">{myAccountNumber || '---'}</code>
                <button onClick={() => handleCopy(myAccountNumber, 'account')} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:text-[#D4A853] transition-all">
                  {copiedField === 'account' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm"><span className="text-[#F5F5F0]/40">Bank Name</span><span className="text-[#F5F5F0]">Transfera Banking</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#F5F5F0]/40">Routing Number</span><span className="text-[#F5F5F0] font-mono">084009519</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#F5F5F0]/40">Account Holder</span><span className="text-[#F5F5F0]">{profileName}</span></div>
            </div>
            <div className="bg-[#D4A853]/5 border border-[#D4A853]/10 rounded-xl p-4 mb-6">
              <p className="text-xs text-[#D4A853]/70">Funds are added by the admin after verification. Contact support for expedited processing.</p>
            </div>
            <button onClick={() => setShowAddFundsModal(false)} className="w-full py-3 rounded-xl bg-[#D4A853] text-[#0C1222] font-semibold hover:bg-[#D4A853]/90 transition-all">Got it</button>
          </div>
        </div>
      )}

      {/* My Cards Modal — FUNCTIONAL */}
      {showCardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCardsModal(false)}>
          <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/10 p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-[#F5F5F0]">My Cards</h3>
                <p className="text-sm text-[#F5F5F0]/50 mt-1">Virtual debit card</p>
              </div>
              <button onClick={() => setShowCardsModal(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:text-[#F5F5F0]"><X className="w-4 h-4" /></button>
            </div>

            {/* Virtual Card */}
            <div className="relative bg-gradient-to-br from-[#D4A853] to-[#B08A3E] rounded-2xl p-6 mb-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-[#0C1222] font-bold text-lg tracking-wider">TRANSFERA</span>
                  <span className="text-[#0C1222]/70 text-xs font-medium">VIRTUAL</span>
                </div>
                <div className="font-mono text-[#0C1222] text-lg tracking-[0.12em] mb-6">{virtualCard.cardNum}</div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[#0C1222]/60 text-[10px] uppercase tracking-wider mb-0.5">Card Holder</p>
                    <p className="text-[#0C1222] text-sm font-medium uppercase">{profileName}</p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[#0C1222]/60 text-[10px] uppercase tracking-wider mb-0.5">Expires</p>
                      <p className="text-[#0C1222] text-sm font-medium font-mono">{virtualCard.expiry}</p>
                    </div>
                    <div>
                      <p className="text-[#0C1222]/60 text-[10px] uppercase tracking-wider mb-0.5">CVV</p>
                      <p className="text-[#0C1222] text-sm font-medium font-mono flex items-center gap-1">
                        {showCvv ? virtualCard.cvv : '***'}
                        <button onClick={() => setShowCvv(!showCvv)} className="ml-1">
                          {showCvv ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${cardFrozen ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} />
                  <span className="text-sm text-[#F5F5F0]">{cardFrozen ? 'Card Frozen' : 'Card Active'}</span>
                </div>
                <button onClick={() => setCardFrozen(!cardFrozen)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${cardFrozen ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                  {cardFrozen ? 'Unfreeze Card' : 'Freeze Card'}
                </button>
              </div>
              <button onClick={() => handleCopy(virtualCard.cardNum.replace(/\s/g, ''), 'cardnum')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[#F5F5F0] text-sm hover:bg-white/10 transition-all">
                {copiedField === 'cardnum' ? <><Check className="w-4 h-4 text-emerald-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Card Number</>}
              </button>
            </div>

            <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-[#F5F5F0]/40">This is a virtual debit card for online purchases. Daily limit: $5,000. Contact support to request a physical card.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
