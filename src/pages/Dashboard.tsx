import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowUpRight, ArrowDownLeft, Send, Plus, RefreshCw,
  CreditCard, Shield, Globe, ChevronRight, Bell,
  Wallet, Clock, TrendingUp, Filter, Download,
} from 'lucide-react';

const recentTransfers = [
  { id: '1', recipient: 'Sarah Johnson', initials: 'SJ', amount: 1250, currency: 'USD', status: 'completed', date: 'Today, 2:34 PM', type: 'send', method: 'Bank Transfer' },
  { id: '2', recipient: 'Marco Rossi', initials: 'MR', amount: 850, currency: 'EUR', status: 'pending', date: 'Today, 11:20 AM', type: 'send', method: 'Mobile Wallet' },
  { id: '3', recipient: 'Amara Okafor', initials: 'AO', amount: 2100, currency: 'USD', status: 'completed', date: 'Yesterday', type: 'send', method: 'Bank Transfer' },
  { id: '4', recipient: 'James Wilson', initials: 'JW', amount: 500, currency: 'GBP', status: 'completed', date: 'Mar 15, 2026', type: 'receive', method: 'Direct Deposit' },
];

const recentActivity = [
  { id: '1', type: 'deposit', amount: 3000, currency: 'USD', description: 'Account Top-up', date: 'Today, 9:00 AM' },
  { id: '2', type: 'send', amount: 1250, currency: 'USD', description: 'Transfer to Sarah Johnson', date: 'Today, 2:34 PM' },
  { id: '3', type: 'exchange', amount: 850, currency: 'EUR', description: 'USD to EUR conversion', date: 'Today, 11:20 AM' },
  { id: '4', type: 'send', amount: 2100, currency: 'USD', description: 'Transfer to Amara Okafor', date: 'Yesterday' },
  { id: '5', type: 'receive', amount: 500, currency: 'GBP', description: 'Received from James Wilson', date: 'Mar 15, 2026' },
];

const savedRecipients = [
  { name: 'Sarah Johnson', initials: 'SJ', country: 'United States' },
  { name: 'Marco Rossi', initials: 'MR', country: 'Italy' },
  { name: 'Amara Okafor', initials: 'AO', country: 'Nigeria' },
  { name: 'Priya Sharma', initials: 'PS', country: 'India' },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'send' | 'request' | 'exchange'>('send');
  const [amount, setAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

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
              {['Dashboard', 'Transfers', 'Recipients', 'Cards'].map((item) => (
                <button key={item} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${item === 'Dashboard' ? 'bg-white/10 text-[#F5F5F0]' : 'text-[#F5F5F0]/50 hover:text-[#F5F5F0] hover:bg-white/5'}`}>
                  {item}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#F5F5F0]/60 hover:bg-white/10 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#D4A853] rounded-full" />
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
        {/* Success Toast */}
        {showSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-400">Transfer Initiated Successfully!</p>
              <p className="text-xs text-emerald-400/60">Your transfer is pending approval. Reference: TXN-2026-001</p>
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
                  <p className="text-3xl font-bold text-[#F5F5F0] font-mono">$24,562.80</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +2.4%
                    </span>
                    <span className="text-xs text-[#F5F5F0]/30">vs last month</span>
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
                  <p className="text-3xl font-bold text-[#F5F5F0] font-mono">$3,100.00</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#D4A853]/10 text-[#D4A853]">2 transfers</span>
                    <span className="text-xs text-[#F5F5F0]/30">awaiting approval</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Transfer */}
            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/5 overflow-hidden">
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
                          <button key={r.name} type="button" className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#D4A853]/30 hover:bg-[#D4A853]/5 transition-all group">
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
                        <input type="text" placeholder="Enter full name" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Country</label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                          <select className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#F5F5F0] focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none appearance-none">
                            <option value="US">United States (USD)</option>
                            <option value="GB">United Kingdom (GBP)</option>
                            <option value="EU">European Union (EUR)</option>
                            <option value="NG">Nigeria (NGN)</option>
                            <option value="IN">India (INR)</option>
                            <option value="BR">Brazil (BRL)</option>
                            <option value="GH">Ghana (GHS)</option>
                            <option value="KE">Kenya (KES)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Account / Mobile Number</label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                          <input type="text" placeholder="Account or mobile number" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Amount</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#D4A853]">$</span>
                          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/20 transition-all outline-none font-mono" />
                        </div>
                      </div>
                    </div>

                    {amount && parseFloat(amount) > 0 && (
                      <div className="bg-[#D4A853]/5 border border-[#D4A853]/10 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#F5F5F0]/50">You send</span>
                          <span className="text-sm font-mono font-medium text-[#F5F5F0]">${parseFloat(amount).toFixed(2)} USD</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#F5F5F0]/50">Exchange rate</span>
                          <span className="text-sm font-mono text-[#F5F5F0]/70">1 USD = 0.92 EUR</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#F5F5F0]/50">Fee</span>
                          <span className="text-sm font-mono text-emerald-400">$0.00</span>
                        </div>
                        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                          <span className="text-sm font-medium text-[#F5F5F0]">They receive</span>
                          <span className="text-lg font-mono font-bold text-[#D4A853]">€{(parseFloat(amount) * 0.92).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <button type="submit" className="w-full py-4 rounded-xl bg-[#D4A853] text-[#0C1222] font-semibold hover:bg-[#D4A853]/90 transition-all flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> Initiate Transfer
                    </button>
                  </form>
                )}

                {activeTab !== 'send' && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      {activeTab === 'request' ? <ArrowDownLeft className="w-8 h-8 text-[#F5F5F0]/20" /> : <RefreshCw className="w-8 h-8 text-[#F5F5F0]/20" />}
                    </div>
                    <p className="text-[#F5F5F0]/40 text-sm">{activeTab === 'request' ? 'Request money' : 'Currency exchange'} feature coming soon</p>
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
                {recentTransfers.map((t) => (
                  <div key={t.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      {t.type === 'receive' ? (
                        <div className="w-11 h-11 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#D4A853]/20 to-[#B08A3E]/20 flex items-center justify-center border border-[#D4A853]/20">
                          <span className="text-xs font-semibold text-[#D4A853]">{t.initials}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-[#F5F5F0] group-hover:text-[#D4A853] transition-colors">{t.recipient}</p>
                        <p className="text-xs text-[#F5F5F0]/40 mt-0.5">{t.method} &middot; {t.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-mono font-medium ${t.type === 'receive' ? 'text-emerald-400' : 'text-[#F5F5F0]'}`}>
                        {t.type === 'receive' ? '+' : '-'}{t.currency} {t.amount.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[#D4A853]/10 text-[#D4A853]'}`}>
                        {t.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
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
                {[
                  { icon: Send, label: 'Send Money', desc: 'Transfer to anyone', color: '#D4A853' },
                  { icon: Plus, label: 'Add Funds', desc: 'Top up your account', color: '#4ADE80' },
                  { icon: RefreshCw, label: 'Exchange', desc: 'Convert currencies', color: '#60A5FA' },
                  { icon: CreditCard, label: 'My Cards', desc: 'Manage cards', color: '#A78BFA' },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <button key={label} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
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

            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-semibold text-[#F5F5F0]/60 uppercase tracking-wider">Recent Activity</h3>
              </div>
              <div className="p-6 space-y-4">
                {recentActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'deposit' || a.type === 'receive' ? 'bg-emerald-500/10' : a.type === 'exchange' ? 'bg-blue-500/10' : 'bg-[#D4A853]/10'}`}>
                      {a.type === 'deposit' ? <Plus className="w-4 h-4 text-emerald-400" /> : a.type === 'receive' ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : a.type === 'exchange' ? <RefreshCw className="w-4 h-4 text-blue-400" /> : <Send className="w-4 h-4 text-[#D4A853]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#F5F5F0]">{a.description}</p>
                      <p className="text-xs text-[#F5F5F0]/30 mt-0.5">{a.date}</p>
                    </div>
                    <span className={`text-sm font-mono font-medium shrink-0 ${a.type === 'receive' || a.type === 'deposit' ? 'text-emerald-400' : 'text-[#F5F5F0]'}`}>
                      {a.type === 'receive' || a.type === 'deposit' ? '+' : '-'}{a.currency} {a.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-6 border border-white/5">
              <h3 className="text-sm font-semibold text-[#F5F5F0]/60 uppercase tracking-wider mb-4">Transfer Limits</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#F5F5F0]/50">Daily Limit</span>
                    <span className="text-[#F5F5F0] font-mono">$8,450 / $10,000</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#B08A3E] rounded-full" style={{ width: '84.5%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#F5F5F0]/50">Monthly Limit</span>
                    <span className="text-[#F5F5F0] font-mono">$42,100 / $50,000</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#D4A853] to-[#B08A3E] rounded-full" style={{ width: '84.2%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/5 to-[#14192A] rounded-3xl p-6 border border-emerald-500/10">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-400">Security Status</h3>
              </div>
              <p className="text-sm text-[#F5F5F0]/60 mb-3">Your account is fully secured with 2FA enabled.</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400">All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
