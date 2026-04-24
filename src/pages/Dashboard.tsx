import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowUpRight, ArrowDownLeft, Send, Plus, RefreshCw,
  CreditCard, Shield, Globe, ChevronRight, Bell,
  Wallet, Clock, TrendingUp, Filter, Download,
  FileText, X, Eye, EyeOff, Copy, Check,
  Building2, Users, AlertTriangle, Bookmark, Trash2, UserCheck,
} from 'lucide-react';
import {
  createTransfer,
  createInternalTransfer,
  getTransfers,
  getTransactions,
  getCountries,
  calculateExchange,
  subscribeToTransfers,
  subscribeToTransactions,
  getBeneficiaries,
  saveBeneficiary,
  deleteBeneficiary,
  getUserEmailByAccount,
  findAccountByNumber,
} from '@/lib/database';
import { sendEmail, buildDebitAlertHTML, buildCreditAlertHTML } from '@/lib/emailService';
import { getBankInfo } from '@/lib/bankData';
import type { Transfer, Transaction, Country, Beneficiary } from '@/types';

interface Notification {
  id: string;
  type: 'debit' | 'credit' | 'transfer_status';
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  referenceCode?: string;
  read: boolean;
  createdAt: string;
}

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

function generateVirtualCard(accountNumber: string) {
  const seed = accountNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const cardNum = `4${String(seed).padStart(3, '0')} ${String((seed * 7) % 10000).padStart(4, '0')} ${String((seed * 13) % 10000).padStart(4, '0')} ${String((seed * 17) % 10000).padStart(4, '0')}`;
  const expiryMonth = String(((seed * 3) % 12) + 1).padStart(2, '0');
  const expiryYear = String(26 + ((seed * 5) % 5));
  const cvv = String((seed * 11) % 1000).padStart(3, '0');
  return { cardNum, expiry: `${expiryMonth}/${expiryYear}`, cvv };
}

function generateReceiptHTML(transfer: Transfer, profileName: string, accountNumber: string): string {
  const statusColor = transfer.status === 'completed' ? '#065f46' : transfer.status === 'pending' ? '#92400e' : '#991b1b';
  const statusBg = transfer.status === 'completed' ? '#d1fae5' : transfer.status === 'pending' ? '#fef3c7' : '#fee2e2';
  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt - ${transfer.reference_code}</title>
<style>
*{box-sizing:border-box;}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#f5f5f5;margin:0;padding:40px 20px;}
.receipt{max-width:600px;margin:0 auto;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
.header{text-align:center;border-bottom:2px solid #D4A853;padding-bottom:24px;margin-bottom:24px;}
.header h1{color:#0C1222;font-size:24px;margin:0 0 8px;}
.header p{color:#666;font-size:14px;margin:0;}
.status{display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;text-transform:uppercase;}
.section-title{font-size:11px;font-weight:600;text-transform:uppercase;color:#999;letter-spacing:0.08em;margin:20px 0 12px;padding-bottom:6px;border-bottom:1px solid #eee;}
.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f5f5f5;}
.label{color:#888;font-size:13px;}.value{color:#0C1222;font-size:13px;font-weight:500;text-align:right;max-width:60%;}
.amount{font-size:32px;font-weight:700;color:#0C1222;text-align:center;margin:24px 0 8px;}
.sub-amount{text-align:center;color:#888;font-size:13px;margin-bottom:24px;}
.footer{text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #eee;color:#999;font-size:12px;}
.logo{width:48px;height:48px;background:#D4A853;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;}
.print-btn{display:block;width:100%;padding:12px;margin-top:20px;background:#0C1222;color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;}
@media print{body{background:white;padding:0;}.receipt{box-shadow:none;max-width:100%;}.print-btn{display:none;}}
</style></head><body>
<div class="receipt">
  <div class="header"><div class="logo"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0C1222" stroke-width="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></div>
  <h1>Transfer Receipt</h1><p>Transfera &middot; ${transfer.reference_code}</p></div>
  <div style="text-align:center;margin:16px 0;"><span class="status" style="background:${statusBg};color:${statusColor};">${transfer.status.toUpperCase()}</span></div>
  <div class="amount">${formatCurrency(transfer.amount, transfer.currency)}</div>
  <div class="sub-amount">${transfer.recipient_currency !== transfer.currency && transfer.converted_amount ? 'Recipient receives: ' + formatCurrency(transfer.converted_amount, transfer.recipient_currency) : ''}</div>

  <div class="section-title">Transfer Details</div>
  <div class="row"><span class="label">Reference Code</span><span class="value">${transfer.reference_code}</span></div>
  <div class="row"><span class="label">Date & Time</span><span class="value">${new Date(transfer.created_at).toLocaleString('en-US',{month:'long',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span></div>
  <div class="row"><span class="label">Transfer Type</span><span class="value">${transfer.recipient_type === 'internal' ? 'Transfera Internal' : 'External Bank Transfer'}</span></div>
  <div class="row"><span class="label">Currency</span><span class="value">${transfer.currency}</span></div>
  ${transfer.exchange_rate ? `<div class="row"><span class="label">Exchange Rate</span><span class="value">1 ${transfer.currency} = ${transfer.exchange_rate} ${transfer.recipient_currency}</span></div>` : ''}
  <div class="row"><span class="label">Description</span><span class="value">${transfer.description || '-'}</span></div>

  <div class="section-title">Sender Information</div>
  <div class="row"><span class="label">Sender Name</span><span class="value">${profileName}</span></div>
  <div class="row"><span class="label">Account Number</span><span class="value">${accountNumber}</span></div>

  <div class="section-title">Recipient Information</div>
  <div class="row"><span class="label">Recipient Name</span><span class="value">${transfer.recipient_name}</span></div>
  ${transfer.recipient_bank_name ? `<div class="row"><span class="label">Bank Name</span><span class="value">${transfer.recipient_bank_name}</span></div>` : ''}
  ${transfer.recipient_account_number ? `<div class="row"><span class="label">Account Number</span><span class="value">${transfer.recipient_account_number}</span></div>` : ''}
  ${transfer.recipient_routing_number ? `<div class="row"><span class="label">Routing / Sort Code</span><span class="value">${transfer.recipient_routing_number}</span></div>` : ''}
  <div class="row"><span class="label">Country</span><span class="value">${transfer.recipient_country}</span></div>
  ${transfer.recipient_currency !== transfer.currency ? `<div class="row"><span class="label">Recipient Currency</span><span class="value">${transfer.recipient_currency}</span></div>` : ''}

  <div class="section-title">Payment Breakdown</div>
  <div class="row"><span class="label">Transfer Amount</span><span class="value">${formatCurrency(transfer.amount, transfer.currency)}</span></div>
  <div class="row"><span class="label">Fee</span><span class="value">${transfer.fee > 0 ? formatCurrency(transfer.fee, transfer.currency) : '<span style="color:#065f46;">Free</span>'}</span></div>
  ${transfer.fee > 0 ? `<div class="row"><span class="label">Total Deducted</span><span class="value" style="font-weight:700;">${formatCurrency(transfer.amount + transfer.fee, transfer.currency)}</span></div>` : ''}
  ${transfer.completed_at ? `<div class="row"><span class="label">Completed</span><span class="value">${new Date(transfer.completed_at).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span></div>` : ''}

  <div class="footer"><p>Thank you for using Transfera</p><p>support@transfera.com</p></div>
  <button class="print-btn" onclick="window.print()">🖨 Print Receipt</button>
</div>
</body></html>`;
}

function openReceipt(transfer: Transfer, profileName: string, accountNumber: string) {
  const html = generateReceiptHTML(transfer, profileName, accountNumber);
  const w = window.open('', '_blank', 'width=700,height=800');
  if (w) { w.document.write(html); w.document.close(); }
}

export default function Dashboard() {
  const { user, profile, refreshProfile, signOut, isProfileLoading } = useAuth();
  const transferFormRef = useRef<HTMLDivElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'send' | 'request' | 'exchange'>('send');

  // ── Transfer Type: 'internal' | 'external' ──
  const [transferType, setTransferType] = useState<'internal' | 'external'>('external');

  // ── External Form State ──
  const [recipientName, setRecipientName] = useState('');
  const [country, setCountry] = useState('US');
  const [bank, setBank] = useState('');
  const [accountNumberExt, setAccountNumberExt] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // ── Internal Form State ──
  const [internalAccountNum, setInternalAccountNum] = useState('');
  const [internalAmount, setInternalAmount] = useState('');
  const [internalDescription, setInternalDescription] = useState('');

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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; sub?: string } | null>(null);

  // Beneficiary state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);
  const [saveAsBeneficiaryInt, setSaveAsBeneficiaryInt] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Modals
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [cardFrozen, setCardFrozen] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.account?.id) return;
    setIsLoading(true);
    try {
      const [tData, txData, cData] = await Promise.all([
        getTransfers(profile.account.id, undefined, 50),
        getTransactions(profile.account.id, 20),
        getCountries(),
      ]);
      setTransfers(tData);
      setTransactions(txData);
      setCountries(cData);
    } catch { /* silent */ }
    setIsLoading(false);
  }, [profile?.account?.id]);

  const fetchBeneficiaries = useCallback(async () => {
    if (!user?.id) return;
    try {
      const bData = await getBeneficiaries(user.id);
      setBeneficiaries(bData);
    } catch { /* silent */ }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchBeneficiaries(); }, [fetchBeneficiaries]);

  // Generate notifications from transfer data
  useEffect(() => {
    console.log('[NOTIF] profile?.account?.id:', profile?.account?.id, 'transfers.length:', transfers.length);
    if (!profile?.account?.id) {
      console.log('[NOTIF] No account ID, skipping');
      return;
    }
    if (transfers.length === 0) {
      console.log('[NOTIF] No transfers, clearing notifications');
      setNotifications([]);
      return;
    }
    const myAccountId = profile.account.id;
    console.log('[NOTIF] Generating notifications for', transfers.length, 'transfers');
    const notifs: Notification[] = transfers.slice(0, 20).map(t => {
      const isDebit = t.sender_account_id === myAccountId;
      console.log('[NOTIF] Transfer', t.id, 'sender:', t.sender_account_id, 'me:', myAccountId, 'isDebit:', isDebit);
      if (isDebit) {
        return {
          id: `debit-${t.id}`,
          type: 'debit' as const,
          title: t.status === 'pending' ? 'Transfer Pending' : t.status === 'completed' ? 'Transfer Completed' : 'Transfer Sent',
          message: `You sent ${formatCurrency(t.amount, t.currency)} to ${t.recipient_name}`,
          amount: t.amount,
          currency: t.currency,
          referenceCode: t.reference_code,
          read: false,
          createdAt: t.created_at,
        };
      } else {
        return {
          id: `credit-${t.id}`,
          type: 'credit' as const,
          title: 'Money Received',
          message: `You received ${formatCurrency(t.amount, t.currency)} from ${t.recipient_name}`,
          amount: t.amount,
          currency: t.currency,
          referenceCode: t.reference_code,
          read: false,
          createdAt: t.created_at,
        };
      }
    });
    setNotifications(prev => {
      const readMap = new Map(prev.filter(n => n.read).map(n => [n.id, true]));
      const merged = notifs.map(n => ({ ...n, read: readMap.has(n.id) || n.read }));
      console.log('[NOTIF] Generated', merged.length, 'notifications');
      return merged;
    });
  }, [transfers, profile?.account?.id]);

  useEffect(() => {
    if (!profile?.account?.id) return;
    const tSub = subscribeToTransfers(profile.account.id, () => { fetchData(); refreshProfile(); });
    const txSub = subscribeToTransactions(profile.account.id, () => { fetchData(); refreshProfile(); });
    return () => { tSub.unsubscribe(); txSub.unsubscribe(); };
  }, [profile?.account?.id, fetchData, refreshProfile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Bank info for selected country ──
  const bankInfo = getBankInfo(country);

  // ── Computed values ──
  const balance = profile?.account?.balance ?? 0;
  const currency = profile?.account?.currency ?? 'USD';
  const myAccountNumber = profile?.account?.account_number ?? '';
  const pendingAmount = transfers.filter(t => t.status === 'pending').reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0), 0);
  const pendingFees = transfers.filter(t => t.status === 'pending').reduce((sum, t) => sum + (typeof t.fee === 'number' ? t.fee : 0), 0);
  const availableBalance = balance - pendingAmount - pendingFees;

  // ── Transfer Limits ──
  const DAILY_LIMIT = 30000;
  const MONTHLY_LIMIT = 100000;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const dailySent = transfers.filter(t => { const d = new Date(t.created_at); return d >= todayStart && (t.status === 'completed' || t.status === 'pending'); }).reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0) + (typeof t.fee === 'number' ? t.fee : 0), 0);
  const monthlySent = transfers.filter(t => { const d = new Date(t.created_at); return d >= monthStart && (t.status === 'completed' || t.status === 'pending'); }).reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : 0) + (typeof t.fee === 'number' ? t.fee : 0), 0);
  const dailyRemaining = Math.max(0, DAILY_LIMIT - dailySent);
  const monthlyRemaining = Math.max(0, MONTHLY_LIMIT - monthlySent);
  const dailyPct = Math.min((dailySent / DAILY_LIMIT) * 100, 100);
  const monthlyPct = Math.min((monthlySent / MONTHLY_LIMIT) * 100, 100);
  const limitReached = dailyRemaining <= 0;

  const virtualCard = generateVirtualCard(myAccountNumber || 'TR00000000');

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); });
  };

  // ── External Transfer ──
  const handleExternalSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.account?.id) return;
    const amt = parseFloat(amount);
    if (!recipientName.trim() || !amt || amt <= 0) return;
    const totalWithFee = amt + 10;
    if (totalWithFee > dailyRemaining) { setToast({ type: 'error', message: 'Daily Limit Exceeded', sub: `You can only send up to ${formatCurrency(Math.max(0, dailyRemaining - 10), currency)} (plus $10 fee) today.` }); return; }
    if (totalWithFee > availableBalance) { setToast({ type: 'error', message: 'Insufficient Balance', sub: `Your available balance is ${formatCurrency(availableBalance, currency)} (includes $10 fee).` }); return; }

    setIsSubmitting(true);
    try {
      const selectedCountry = countries.find(c => c.code === country);
      const result = await createTransfer({
        sender_account_id: profile.account.id,
        recipient_type: 'external_bank',
        recipient_name: recipientName.trim(),
        recipient_country: selectedCountry?.code || country,
        amount: amt,
        fee: 10,
        currency: currency,
        recipient_currency: selectedCountry?.currency_code || currency,
        recipient_bank_name: bank || undefined,
        ...(accountNumberExt.trim() ? { recipient_account_number: accountNumberExt.trim() } : {}),
        ...(routingNumber.trim() ? { recipient_routing_number: routingNumber.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      if (result) {
        setToast({ type: 'success', message: 'Transfer Initiated!', sub: `Reference: ${result.reference_code}. Pending admin approval.` });

        // Send debit alert email to sender
        if (user?.email) {
          const newBal = availableBalance - amt - 10;
          sendEmail({
            to: user.email,
            subject: `Transfera Debit Alert — ${formatCurrency(amt + 10, currency)}`,
            html: buildDebitAlertHTML({
              senderName: profileName,
              recipientName: recipientName.trim(),
              amount: amt,
              currency,
              fee: 10,
              referenceCode: result.reference_code,
              date: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              transferType: `External Bank — ${bank || selectedCountry?.name || country}`,
              newBalance: newBal,
            }),
          });
        }

        // Save beneficiary if checked
        if (saveAsBeneficiary && user?.id) {
          await saveBeneficiary(user.id, {
            name: recipientName.trim(),
            account_number: accountNumberExt.trim() || undefined,
            bank_name: bank || undefined,
            country: selectedCountry?.code || country,
            country_name: selectedCountry?.name,
            currency: selectedCountry?.currency_code || currency,
            routing_number: routingNumber.trim() || undefined,
            recipient_type: 'external_bank',
          });
          fetchBeneficiaries();
        }
        setRecipientName(''); setCountry('US'); setBank(''); setAccountNumberExt(''); setRoutingNumber(''); setAmount(''); setDescription(''); setSaveAsBeneficiary(false);
        fetchData(); refreshProfile();
      }
    } catch (err: unknown) { setToast({ type: 'error', message: 'Transfer Failed', sub: err instanceof Error ? err.message : 'Please try again.' }); }
    setIsSubmitting(false);
  };

  // ── Internal Transfer ──
  const handleInternalSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.account?.id || !user) return;
    const amt = parseFloat(internalAmount);
    if (!internalAccountNum.trim() || !amt || amt <= 0) return;
    if (amt > dailyRemaining) { setToast({ type: 'error', message: 'Daily Limit Exceeded', sub: `You can only send up to ${formatCurrency(dailyRemaining, currency)} today.` }); return; }
    if (amt > availableBalance) { setToast({ type: 'error', message: 'Insufficient Balance', sub: `Your available balance is ${formatCurrency(availableBalance, currency)}.` }); return; }

    setIsSubmitting(true);
    try {
      const { transfer: result } = await createInternalTransfer(
        profile.account.id,
        internalAccountNum.trim().toUpperCase(),
        amt,
        internalDescription.trim() || undefined
      );
      if (result) {
        const recipientAcct = internalAccountNum.trim().toUpperCase();
        const recName = result.recipient_name || `Transfera Account ${recipientAcct}`;
        setToast({ type: 'success', message: 'Transfer Completed!', sub: `${formatCurrency(amt, currency)} sent to ${recName}. Ref: ${result.reference_code}` });

        // Send debit alert to sender
        if (user?.email) {
          const newBal = availableBalance - amt;
          sendEmail({
            to: user.email,
            subject: `Transfera Debit Alert — ${formatCurrency(amt, currency)} sent`,
            html: buildDebitAlertHTML({
              senderName: profileName,
              recipientName: recName,
              amount: amt,
              currency,
              fee: 0,
              referenceCode: result.reference_code,
              date: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              transferType: 'Transfera Internal',
              newBalance: newBal,
            }),
          });
        }

        // Send credit alert to recipient
        const recipientEmail = await getUserEmailByAccount(recipientAcct);
        if (recipientEmail) {
          const recAcctData = await findAccountByNumber(recipientAcct);
          sendEmail({
            to: recipientEmail,
            subject: `Transfera Credit Alert — ${formatCurrency(amt, currency)} received`,
            html: buildCreditAlertHTML({
              recipientName: recName.split(' (')[0] || 'Transfera User',
              senderName: profileName,
              amount: amt,
              currency,
              referenceCode: result.reference_code,
              date: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
              newBalance: recAcctData?.balance || amt,
            }),
          });
        }

        // Save beneficiary if checked
        if (saveAsBeneficiaryInt && user?.id) {
          await saveBeneficiary(user.id, {
            name: `Transfera ${internalAccountNum.trim().toUpperCase()}`,
            account_number: internalAccountNum.trim().toUpperCase(),
            country: 'US',
            country_name: 'United States',
            currency: currency,
            recipient_type: 'internal',
          });
          fetchBeneficiaries();
        }
        setInternalAccountNum(''); setInternalAmount(''); setInternalDescription(''); setSaveAsBeneficiaryInt(false);
        fetchData(); refreshProfile();
      }
    } catch (err: unknown) { setToast({ type: 'error', message: 'Transfer Failed', sub: err instanceof Error ? err.message : 'Please try again.' }); }
    setIsSubmitting(false);
  };

  // Select a saved beneficiary to auto-fill the form
  const selectBeneficiary = (b: Beneficiary) => {
    if (b.recipient_type === 'internal') {
      setTransferType('internal');
      setInternalAccountNum(b.account_number || '');
    } else {
      setTransferType('external');
      setRecipientName(b.name);
      setCountry(b.country);
      setBank(b.bank_name || '');
      setAccountNumberExt(b.account_number || '');
      setRoutingNumber(b.routing_number || '');
    }
    setActiveTab('send');
    transferFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteBeneficiary = async (id: string) => {
    try { await deleteBeneficiary(id); fetchBeneficiaries(); } catch { /* silent */ }
  };

  // Exchange
  const handleCalculateExchange = async () => {
    const amt = parseFloat(exchangeAmount);
    if (!amt || amt <= 0) return;
    setExchangeLoading(true);
    try {
      const result = await calculateExchange(exchangeFrom, exchangeTo, amt);
      if (result) setExchangeResult(result);
      else setToast({ type: 'error', message: 'Rate not available' });
    } catch { setToast({ type: 'error', message: 'Calculation failed' }); }
    setExchangeLoading(false);
  };
  useEffect(() => { if (activeTab === 'exchange') handleCalculateExchange(); /* eslint-disable-next-line */ }, [activeTab, exchangeFrom, exchangeTo]);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Quick actions
  const scrollToSend = () => { setActiveTab('send'); setTransferType('external'); transferFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const showAddFunds = () => setShowAddFundsModal(true);
  const scrollToExchange = () => { setActiveTab('exchange'); transferFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const showCards = () => setShowCardsModal(true);
  const quickActions = [
    { icon: Send, label: 'Send Money', desc: 'Transfer to anyone', color: '#D4A853', action: scrollToSend },
    { icon: Plus, label: 'Add Funds', desc: 'Top up your account', color: '#4ADE80', action: showAddFunds },
    { icon: RefreshCw, label: 'Exchange', desc: 'Convert currencies', color: '#60A5FA', action: scrollToExchange },
    { icon: CreditCard, label: 'My Cards', desc: 'Manage cards', color: '#A78BFA', action: showCards },
  ];

  const recentTransfersList = transfers.slice(0, 5);
  const recentActivityList = transactions.slice(0, 5);

  if ((isLoading || isProfileLoading) && !profile) {
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
            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#F5F5F0]/60 hover:bg-white/10 transition-all">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                    <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </span>
                )}
              </button>
              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full mt-3 w-[380px] bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#D4A853]" />
                        <h3 className="text-sm font-semibold text-[#F5F5F0]">Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">{unreadCount} new</span>}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-[#D4A853] hover:text-[#F5F5F0] transition-colors flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[420px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-10 px-6">
                          <Bell className="w-10 h-10 text-[#F5F5F0]/10 mx-auto mb-3" />
                          <p className="text-sm text-[#F5F5F0]/30">No notifications yet</p>
                          <p className="text-xs text-[#F5F5F0]/20 mt-1">Make a transfer to see alerts here</p>
                        </div>
                      ) : notifications.map(n => (
                        <button key={n.id} onClick={() => { markNotificationRead(n.id); setShowNotifications(false); }} className={`w-full text-left px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-all flex items-start gap-3 ${!n.read ? 'bg-[#D4A853]/[0.03]' : ''}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.type === 'debit' ? 'bg-[#D4A853]/10' : n.type === 'credit' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}`}>
                            {n.type === 'debit' ? <Send className="w-4 h-4 text-[#D4A853]" /> : n.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-blue-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-medium ${!n.read ? 'text-[#F5F5F0]' : 'text-[#F5F5F0]/60'}`}>{n.title}</p>
                              {!n.read && <span className="w-2 h-2 rounded-full bg-[#D4A853] shrink-0" />}
                            </div>
                            <p className={`text-xs mt-0.5 ${!n.read ? 'text-[#F5F5F0]/50' : 'text-[#F5F5F0]/30'}`}>{n.message}</p>
                            {n.referenceCode && <p className="text-[10px] text-[#F5F5F0]/20 mt-1 font-mono">{n.referenceCode}</p>}
                            <p className="text-[10px] text-[#F5F5F0]/20 mt-1">{formatDate(n.createdAt)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
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
              {toast.type === 'success' ? <Shield className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>{toast.message}</p>
              {toast.sub && <p className={`text-xs ${toast.type === 'success' ? 'text-emerald-400/60' : 'text-red-400/60'}`}>{toast.sub}</p>}
            </div>
          </div>
        )}

        {/* Daily Limit Warning */}
        {limitReached && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Daily Transfer Limit Reached</p>
              <p className="text-xs text-red-400/60">You have sent {formatCurrency(dailySent, currency)} today. The daily limit is {formatCurrency(DAILY_LIMIT, currency)}. You cannot make more transfers until tomorrow.</p>
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
                  <div className="flex items-center gap-2 mb-4"><Wallet className="w-4 h-4 text-[#D4A853]" /><span className="text-xs font-medium text-[#F5F5F0]/50 uppercase tracking-wider">Total Balance</span></div>
                  <p className="text-3xl font-bold text-[#F5F5F0] font-mono">{formatCurrency(balance, currency)}</p>
                  {pendingAmount > 0 && <p className="text-xs text-[#F5F5F0]/40 mt-1">Available: <span className="font-mono text-[#D4A853]">{formatCurrency(availableBalance, currency)}</span><span className="text-[#F5F5F0]/20"> ({formatCurrency(pendingAmount, currency)} pending)</span></p>}
                  <div className="flex items-center gap-2 mt-2"><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Active</span></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A853]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-[#D4A853]" /><span className="text-xs font-medium text-[#F5F5F0]/50 uppercase tracking-wider">Daily Remaining</span></div>
                  <p className="text-3xl font-bold text-[#F5F5F0] font-mono">{formatCurrency(dailyRemaining, currency)}</p>
                  <div className="flex items-center gap-2 mt-2"><span className="text-xs px-2 py-0.5 rounded-full bg-[#D4A853]/10 text-[#D4A853]">{formatCurrency(dailySent, currency)} / {formatCurrency(DAILY_LIMIT, currency)}</span></div>
                </div>
              </div>
            </div>

            {/* Quick Transfer */}
            <div ref={transferFormRef} className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/5 overflow-hidden">
              <div className="flex border-b border-white/5">
                {[{ key: 'send' as const, label: 'Send Money', icon: Send }, { key: 'request' as const, label: 'Request', icon: ArrowDownLeft }, { key: 'exchange' as const, label: 'Exchange', icon: RefreshCw }].map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setActiveTab(key)} className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === key ? 'text-[#D4A853] border-[#D4A853] bg-[#D4A853]/5' : 'text-[#F5F5F0]/40 border-transparent hover:text-[#F5F5F0]/60 hover:bg-white/5'}`}><Icon className="w-4 h-4" /> {label}</button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'send' && (
                  <>
                    {/* Transfer Type Toggle */}
                    <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                      <button onClick={() => setTransferType('external')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${transferType === 'external' ? 'bg-[#D4A853] text-[#0C1222]' : 'text-[#F5F5F0]/40 hover:text-[#F5F5F0]'}`}>
                        <Building2 className="w-4 h-4" /> External Bank
                      </button>
                      <button onClick={() => setTransferType('internal')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${transferType === 'internal' ? 'bg-[#D4A853] text-[#0C1222]' : 'text-[#F5F5F0]/40 hover:text-[#F5F5F0]'}`}>
                        <Users className="w-4 h-4" /> Transfera Account
                      </button>
                    </div>

                    {/* ── EXTERNAL BANK TRANSFER ── */}
                    {transferType === 'external' && (
                      <form onSubmit={handleExternalSend} className="space-y-5">
                        {/* Limit info */}
                        <div className="bg-white/[0.02] rounded-xl p-3 flex items-center justify-between text-xs">
                          <span className="text-[#F5F5F0]/40">Daily remaining: <span className="text-[#D4A853] font-mono">{formatCurrency(dailyRemaining, currency)}</span></span>
                          <span className="text-[#F5F5F0]/40">Monthly remaining: <span className="text-[#D4A853] font-mono">{formatCurrency(monthlyRemaining, currency)}</span></span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Recipient Name</label>
                            <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Full name of recipient" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none" />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Country</label>
                            <div className="relative">
                              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                              <select value={country} onChange={e => { setCountry(e.target.value); setBank(''); }} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#F5F5F0] focus:border-[#D4A853]/50 outline-none appearance-none">
                                {countries.length > 0 ? countries.map(c => (<option key={c.code} value={c.code}>{c.name} ({c.currency_code})</option>)) : (<><option value="US">United States (USD)</option><option value="GB">United Kingdom (GBP)</option><option value="EU">European Union (EUR)</option><option value="NG">Nigeria (NGN)</option><option value="IN">India (INR)</option><option value="BR">Brazil (BRL)</option><option value="GH">Ghana (GHS)</option><option value="KE">Kenya (KES)</option><option value="PH">Philippines (PHP)</option><option value="MX">Mexico (MXN)</option><option value="ZA">South Africa (ZAR)</option><option value="AU">Australia (AUD)</option><option value="CA">Canada (CAD)</option><option value="JP">Japan (JPY)</option><option value="SG">Singapore (SGD)</option></>)}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Bank Selection */}
                        {bankInfo && bankInfo.banks.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Select Bank</label>
                            <div className="relative">
                              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                              <select value={bank} onChange={e => setBank(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#F5F5F0] focus:border-[#D4A853]/50 outline-none appearance-none">
                                <option value="">-- Select a bank --</option>
                                {bankInfo.banks.map(b => (<option key={b.code} value={b.name}>{b.name}</option>))}
                              </select>
                            </div>
                            {bankInfo.localTransferNote && <p className="text-xs text-[#F5F5F0]/30 mt-1.5">{bankInfo.localTransferNote}</p>}
                          </div>
                        )}

                        {/* Country-specific required fields */}
                        {bankInfo && bankInfo.requiredFields.map((field, i) => (
                          <div key={i}>
                            <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">{field.label}{field.required ? '' : ' (Optional)'}</label>
                            <input
                              type="text"
                              value={field.field === 'account_number' ? accountNumberExt : routingNumber}
                              onChange={e => field.field === 'account_number' ? setAccountNumberExt(e.target.value) : setRoutingNumber(e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none"
                            />
                          </div>
                        ))}

                        {!bankInfo && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                              <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Account Number</label>
                              <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                                <input type="text" value={accountNumberExt} onChange={e => setAccountNumberExt(e.target.value)} placeholder="Account number" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none" />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Routing / Sort Code</label>
                              <input type="text" value={routingNumber} onChange={e => setRoutingNumber(e.target.value)} placeholder="Routing number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none" />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Amount</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#D4A853]">$</span>
                              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="1" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none font-mono" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Description</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this for?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none" />
                          </div>
                        </div>

                        {amount && parseFloat(amount) > 0 && (
                          <div className="bg-[#D4A853]/5 border border-[#D4A853]/10 rounded-2xl p-5 space-y-3">
                            <div className="flex justify-between"><span className="text-sm text-[#F5F5F0]/50">You send</span><span className="text-sm font-mono text-[#F5F5F0]">{formatCurrency(parseFloat(amount), currency)}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-[#F5F5F0]/50">Fee</span><span className="text-sm font-mono text-[#F5F5F0]/70">{formatCurrency(10, currency)}</span></div>
                            <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-sm font-medium text-[#F5F5F0]">Total deducted</span><span className="text-lg font-mono font-bold text-[#D4A853]">{formatCurrency(parseFloat(amount) + 10, currency)}</span></div>
                          </div>
                        )}

                        {/* Save as beneficiary checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${saveAsBeneficiary ? 'bg-[#D4A853] border-[#D4A853]' : 'border-white/20 group-hover:border-white/40'}`}>
                            {saveAsBeneficiary && <Check className="w-3.5 h-3.5 text-[#0C1222]" />}
                            <input type="checkbox" checked={saveAsBeneficiary} onChange={e => setSaveAsBeneficiary(e.target.checked)} className="sr-only" />
                          </div>
                          <div className="flex items-center gap-2"><Bookmark className="w-4 h-4 text-[#D4A853]/60" /><span className="text-sm text-[#F5F5F0]/50 group-hover:text-[#F5F5F0]/70 transition-colors">Save as beneficiary</span></div>
                        </label>

                        <button type="submit" disabled={isSubmitting || limitReached} className="w-full py-4 rounded-xl bg-[#D4A853] text-[#0C1222] font-semibold hover:bg-[#D4A853]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                          {isSubmitting ? <><div className="w-4 h-4 border-2 border-[#0C1222] border-t-transparent rounded-full animate-spin" />Processing...</> : <><Send className="w-4 h-4" /> Initiate Transfer</>}
                        </button>
                      </form>
                    )}

                    {/* ── INTERNAL TRANSFERA TRANSFER ── */}
                    {transferType === 'internal' && (
                      <form onSubmit={handleInternalSend} className="space-y-5">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-start gap-3">
                          <Users className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-emerald-400 font-medium">Transfera-to-Transfera</p>
                            <p className="text-xs text-emerald-400/60">Send money instantly to another Transfera account. The recipient will receive the funds immediately.</p>
                          </div>
                        </div>

                        {/* Limit info */}
                        <div className="bg-white/[0.02] rounded-xl p-3 flex items-center justify-between text-xs">
                          <span className="text-[#F5F5F0]/40">Daily remaining: <span className="text-[#D4A853] font-mono">{formatCurrency(dailyRemaining, currency)}</span></span>
                          <span className="text-[#F5F5F0]/40">Monthly remaining: <span className="text-[#D4A853] font-mono">{formatCurrency(monthlyRemaining, currency)}</span></span>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Recipient Transfera Account Number</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#D4A853]">TR</span>
                            <input type="text" value={internalAccountNum} onChange={e => setInternalAccountNum(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder="XXXXXXXX (8 digits)" required className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none font-mono tracking-wider" />
                          </div>
                          <p className="text-xs text-[#F5F5F0]/30 mt-1">Your account: <span className="text-[#D4A853] font-mono">{myAccountNumber}</span></p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Amount</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#D4A853]">$</span>
                              <input type="number" value={internalAmount} onChange={e => setInternalAmount(e.target.value)} placeholder="0.00" min="1" step="0.01" required className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none font-mono" />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Description (Optional)</label>
                            <input type="text" value={internalDescription} onChange={e => setInternalDescription(e.target.value)} placeholder="What's this for?" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none" />
                          </div>
                        </div>

                        {internalAmount && parseFloat(internalAmount) > 0 && (
                          <div className="bg-[#D4A853]/5 border border-[#D4A853]/10 rounded-2xl p-5 space-y-3">
                            <div className="flex justify-between"><span className="text-sm text-[#F5F5F0]/50">You send</span><span className="text-sm font-mono text-[#F5F5F0]">{formatCurrency(parseFloat(internalAmount), currency)}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-[#F5F5F0]/50">Fee</span><span className="text-sm font-mono text-emerald-400">Free</span></div>
                            <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-sm font-medium text-[#F5F5F0]">Recipient gets</span><span className="text-lg font-mono font-bold text-[#D4A853]">{formatCurrency(parseFloat(internalAmount), currency)}</span></div>
                          </div>
                        )}

                        {/* Save as beneficiary checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${saveAsBeneficiaryInt ? 'bg-[#D4A853] border-[#D4A853]' : 'border-white/20 group-hover:border-white/40'}`}>
                            {saveAsBeneficiaryInt && <Check className="w-3.5 h-3.5 text-[#0C1222]" />}
                            <input type="checkbox" checked={saveAsBeneficiaryInt} onChange={e => setSaveAsBeneficiaryInt(e.target.checked)} className="sr-only" />
                          </div>
                          <div className="flex items-center gap-2"><Bookmark className="w-4 h-4 text-[#D4A853]/60" /><span className="text-sm text-[#F5F5F0]/50 group-hover:text-[#F5F5F0]/70 transition-colors">Save as beneficiary</span></div>
                        </label>

                        <button type="submit" disabled={isSubmitting || limitReached} className="w-full py-4 rounded-xl bg-emerald-500 text-[#0C1222] font-semibold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                          {isSubmitting ? <><div className="w-4 h-4 border-2 border-[#0C1222] border-t-transparent rounded-full animate-spin" />Sending...</> : <><Send className="w-4 h-4" /> Send Instantly</>}
                        </button>
                      </form>
                    )}
                  </>
                )}

                {activeTab === 'exchange' && (
                  <div className="space-y-5">
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
                      <RefreshCw className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div><p className="text-sm text-blue-400 font-medium">Currency Exchange Calculator</p><p className="text-xs text-blue-400/60">Check live exchange rates before you send.</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Amount</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#D4A853]">$</span><input type="number" value={exchangeAmount} onChange={e => setExchangeAmount(e.target.value)} placeholder="0.00" min="1" className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none font-mono" /></div></div>
                      <div><label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">From</label><select value={exchangeFrom} onChange={e => setExchangeFrom(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] focus:border-[#D4A853]/50 outline-none appearance-none"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option><option value="NGN">NGN</option></select></div>
                      <div><label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">To</label><select value={exchangeTo} onChange={e => setExchangeTo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] focus:border-[#D4A853]/50 outline-none appearance-none"><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="NGN">NGN</option><option value="INR">INR</option><option value="BRL">BRL</option></select></div>
                    </div>
                    <button onClick={handleCalculateExchange} disabled={exchangeLoading} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[#F5F5F0] font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2"><RefreshCw className={`w-4 h-4 ${exchangeLoading ? 'animate-spin' : ''}`} /> {exchangeLoading ? 'Calculating...' : 'Calculate'}</button>
                    {exchangeResult && (
                      <div className="bg-[#D4A853]/5 border border-[#D4A853]/10 rounded-2xl p-5 space-y-3">
                        <div className="flex justify-between"><span className="text-sm text-[#F5F5F0]/50">You send</span><span className="text-sm font-mono text-[#F5F5F0]">{formatCurrency(exchangeResult.original_amount, exchangeFrom)}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-[#F5F5F0]/50">Rate</span><span className="text-sm font-mono text-[#F5F5F0]/70">1 {exchangeFrom} = {exchangeResult.exchange_rate.toFixed(4)} {exchangeTo}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-[#F5F5F0]/50">Fee ({exchangeResult.fee_percentage}%)</span><span className="text-sm font-mono text-[#F5F5F0]/70">{formatCurrency(exchangeResult.fee, exchangeFrom)}</span></div>
                        <div className="border-t border-white/10 pt-3 flex justify-between"><span className="text-sm font-medium text-[#F5F5F0]">They receive</span><span className="text-lg font-mono font-bold text-[#D4A853]">{formatCurrency(exchangeResult.converted_amount, exchangeTo)}</span></div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'request' && (
                  <div className="text-center py-12"><div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4"><ArrowDownLeft className="w-8 h-8 text-[#F5F5F0]/20" /></div><p className="text-[#F5F5F0]/40 text-sm">Request money feature coming soon</p></div>
                )}
              </div>
            </div>

            {/* Recent Transfers */}
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3"><Send className="w-5 h-5 text-[#D4A853]" /><h3 className="text-lg font-semibold text-[#F5F5F0]">Recent Transfers</h3></div>
                <div className="flex items-center gap-2"><button className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:bg-white/10 transition-all"><Filter className="w-4 h-4" /></button><button className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:bg-white/10 transition-all"><Download className="w-4 h-4" /></button></div>
              </div>
              <div className="divide-y divide-white/5">
                {isLoading ? (<div className="p-8 text-center text-[#F5F5F0]/30 text-sm">Loading...</div>) : recentTransfersList.length === 0 ? (<div className="p-8 text-center text-[#F5F5F0]/30 text-sm">No transfers yet.</div>) : recentTransfersList.map(t => (
                  <div key={t.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D4A853]/20 to-[#B08A3E]/20 flex items-center justify-center border border-[#D4A853]/20"><span className="text-xs font-semibold text-[#D4A853]">{t.recipient_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}</span></div>
                      <div><p className="text-sm font-medium text-[#F5F5F0] group-hover:text-[#D4A853] transition-colors">{t.recipient_name}</p><p className="text-xs text-[#F5F5F0]/40 mt-0.5">{t.recipient_type === 'internal' ? 'Transfera Account' : t.recipient_country} &middot; {formatDate(t.created_at)} &middot; {t.reference_code}</p></div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div><p className="text-sm font-mono font-medium text-[#F5F5F0]">{formatCurrency(t.amount, t.currency)}</p><span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'pending' ? 'bg-[#D4A853]/10 text-[#D4A853]' : 'bg-red-500/10 text-red-400'}`}>{t.status === 'completed' ? 'Completed' : t.status === 'pending' ? 'Pending' : 'Rejected'}</span></div>
                      <button onClick={() => openReceipt(t, profileName, myAccountNumber)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:bg-[#D4A853]/10 hover:text-[#D4A853] transition-all" title="Receipt"><FileText className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-semibold text-[#F5F5F0]/60 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {quickActions.map(({ icon: Icon, label, desc, color, action }) => (
                  <button key={label} onClick={action} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}><Icon className="w-5 h-5" style={{ color }} /></div>
                    <div className="text-left flex-1"><p className="text-sm font-medium text-[#F5F5F0] group-hover:text-[#D4A853] transition-colors">{label}</p><p className="text-xs text-[#F5F5F0]/30">{desc}</p></div>
                    <ChevronRight className="w-4 h-4 text-[#F5F5F0]/20 group-hover:text-[#D4A853] transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5"><h3 className="text-sm font-semibold text-[#F5F5F0]/60 uppercase tracking-wider">Recent Activity</h3></div>
              <div className="p-6 space-y-4">
                {isLoading ? (<div className="text-center text-[#F5F5F0]/30 text-sm py-4">Loading...</div>) : recentActivityList.length === 0 ? (<div className="text-center text-[#F5F5F0]/30 text-sm py-4">No activity yet.</div>) : recentActivityList.map(a => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'credit' ? 'bg-emerald-500/10' : 'bg-[#D4A853]/10'}`}>{a.type === 'credit' ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <Send className="w-4 h-4 text-[#D4A853]" />}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm text-[#F5F5F0]">{a.description}</p><p className="text-xs text-[#F5F5F0]/30 mt-0.5">{formatDate(a.created_at)}</p></div>
                    <span className={`text-sm font-mono font-medium shrink-0 ${a.type === 'credit' ? 'text-emerald-400' : 'text-[#F5F5F0]'}`}>{a.type === 'credit' ? '+' : '-'}{formatCurrency(a.amount, a.currency).replace('$', '').replace(/[^0-9.,]/g, '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer Limits */}
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-semibold text-[#F5F5F0]/60 uppercase tracking-wider mb-4">Transfer Limits</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2"><span className="text-[#F5F5F0]/50">Daily ({formatCurrency(dailySent, currency)})</span><span className="text-[#F5F5F0] font-mono">{formatCurrency(DAILY_LIMIT, currency)}</span></div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${dailyPct >= 100 ? 'bg-red-500' : 'bg-gradient-to-r from-[#D4A853] to-[#B08A3E]'}`} style={{ width: `${dailyPct}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2"><span className="text-[#F5F5F0]/50">Monthly ({formatCurrency(monthlySent, currency)})</span><span className="text-[#F5F5F0] font-mono">{formatCurrency(MONTHLY_LIMIT, currency)}</span></div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${monthlyPct >= 100 ? 'bg-red-500' : 'bg-gradient-to-r from-[#D4A853] to-[#B08A3E]'}`} style={{ width: `${monthlyPct}%` }} /></div>
                </div>
              </div>
            </div>

            {/* Saved Beneficiaries */}
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-[#D4A853]" />
                  <h3 className="text-sm font-semibold text-[#F5F5F0]/60 uppercase tracking-wider">Saved Beneficiaries</h3>
                </div>
                <span className="text-xs text-[#F5F5F0]/30">{beneficiaries.length}</span>
              </div>
              <div className="p-4 space-y-2 max-h-[280px] overflow-y-auto">
                {beneficiaries.length === 0 ? (
                  <div className="text-center py-4"><p className="text-xs text-[#F5F5F0]/30">No saved beneficiaries yet.</p><p className="text-xs text-[#F5F5F0]/20 mt-1">Check "Save as beneficiary" when sending.</p></div>
                ) : beneficiaries.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/5 transition-all group">
                    <button onClick={() => selectBeneficiary(b)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4A853]/20 to-[#B08A3E]/20 flex items-center justify-center border border-[#D4A853]/20 shrink-0">
                        {b.recipient_type === 'internal' ? <UserCheck className="w-4 h-4 text-[#D4A853]" /> : <Building2 className="w-4 h-4 text-[#D4A853]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#F5F5F0] truncate">{b.name}</p>
                        <p className="text-xs text-[#F5F5F0]/30 truncate">{b.recipient_type === 'internal' ? b.account_number : `${b.bank_name || b.country} ${b.account_number ? '· ' + b.account_number.slice(-4) : ''}`}</p>
                      </div>
                    </button>
                    <button onClick={() => handleDeleteBeneficiary(b.id)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[#F5F5F0]/20 hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Security Status */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-[#14192A] rounded-3xl p-6 border border-emerald-500/10">
              <div className="flex items-center gap-3 mb-3"><Shield className="w-5 h-5 text-emerald-400" /><h3 className="text-sm font-semibold text-emerald-400">Security Status</h3></div>
              <p className="text-sm text-[#F5F5F0]/60 mb-3">Your account is secured with email authentication.</p>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs text-emerald-400">All systems operational</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddFundsModal(false)}>
          <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/10 p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-[#F5F5F0] mb-2">Add Funds</h3>
            <p className="text-sm text-[#F5F5F0]/50 mb-6">Send a wire transfer to your account number below. Funds are credited after admin verification.</p>
            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mb-6">
              <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Your Account Number</label>
              <div className="flex items-center gap-3"><code className="text-2xl font-mono font-bold text-[#D4A853] tracking-wider">{myAccountNumber || '---'}</code><button onClick={() => handleCopy(myAccountNumber, 'account')} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:text-[#D4A853] transition-all">{copiedField === 'account' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}</button></div>
            </div>
            <div className="space-y-3 mb-6"><div className="flex justify-between text-sm"><span className="text-[#F5F5F0]/40">Bank</span><span className="text-[#F5F5F0]">Transfera</span></div><div className="flex justify-between text-sm"><span className="text-[#F5F5F0]/40">Routing</span><span className="text-[#F5F5F0] font-mono">084009519</span></div><div className="flex justify-between text-sm"><span className="text-[#F5F5F0]/40">Holder</span><span className="text-[#F5F5F0]">{profileName}</span></div></div>
            <button onClick={() => setShowAddFundsModal(false)} className="w-full py-3 rounded-xl bg-[#D4A853] text-[#0C1222] font-semibold hover:bg-[#D4A853]/90 transition-all">Got it</button>
          </div>
        </div>
      )}

      {/* My Cards Modal */}
      {showCardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCardsModal(false)}>
          <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/10 p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><div><h3 className="text-xl font-semibold text-[#F5F5F0]">My Cards</h3><p className="text-sm text-[#F5F5F0]/50 mt-1">Virtual debit card</p></div><button onClick={() => setShowCardsModal(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#F5F5F0]/40 hover:text-[#F5F5F0]"><X className="w-4 h-4" /></button></div>
            <div className="relative bg-gradient-to-br from-[#D4A853] to-[#B08A3E] rounded-2xl p-6 mb-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" /><div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              <div className="relative"><div className="flex items-center justify-between mb-8"><span className="text-[#0C1222] font-bold text-lg tracking-wider">TRANSFERA</span><span className="text-[#0C1222]/70 text-xs font-medium">VIRTUAL</span></div>
                <div className="font-mono text-[#0C1222] text-lg tracking-[0.12em] mb-6">{virtualCard.cardNum}</div>
                <div className="flex items-end justify-between"><div><p className="text-[#0C1222]/60 text-[10px] uppercase tracking-wider mb-0.5">Card Holder</p><p className="text-[#0C1222] text-sm font-medium uppercase">{profileName}</p></div><div className="flex gap-4"><div><p className="text-[#0C1222]/60 text-[10px] uppercase tracking-wider mb-0.5">Expires</p><p className="text-[#0C1222] text-sm font-medium font-mono">{virtualCard.expiry}</p></div><div><p className="text-[#0C1222]/60 text-[10px] uppercase tracking-wider mb-0.5">CVV</p><p className="text-[#0C1222] text-sm font-medium font-mono flex items-center gap-1">{showCvv ? virtualCard.cvv : '***'}<button onClick={() => setShowCvv(!showCvv)} className="ml-1">{showCvv ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</button></p></div></div></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${cardFrozen ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} /><span className="text-sm text-[#F5F5F0]">{cardFrozen ? 'Frozen' : 'Active'}</span></div><button onClick={() => setCardFrozen(!cardFrozen)} className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${cardFrozen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{cardFrozen ? 'Unfreeze' : 'Freeze'}</button></div>
              <button onClick={() => handleCopy(virtualCard.cardNum.replace(/\s/g, ''), 'cardnum')} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-[#F5F5F0] text-sm hover:bg-white/10 transition-all">{copiedField === 'cardnum' ? <><Check className="w-4 h-4 text-emerald-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy Card Number</>}</button>
            </div>
            <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/5"><p className="text-xs text-[#F5F5F0]/40">Virtual card for online purchases. Daily limit: $5,000.</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
