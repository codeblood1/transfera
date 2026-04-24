import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Lock, Shield, Bell, AlertTriangle, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
  const { profile, user, signOut, updatePassword } = useAuth();

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Notification settings state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [transferAlerts, setTransferAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New password and confirmation do not match');
      return;
    }

    setPwdLoading(true);
    try {
      await updatePassword(newPassword);
      setPwdSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : 'Failed to update password');
    }
    setPwdLoading(false);
  };

  const userName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : (user?.email?.split('@')[0] || 'User');

  return (
    <div className="min-h-screen bg-[#0C1222]">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-[#0C1222]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#F5F5F0]/60 hover:bg-white/10 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-[#F5F5F0]">Profile & Settings</h1>
          </div>
          <button onClick={signOut} className="text-sm text-[#F5F5F0]/40 hover:text-red-400 transition-colors">Logout</button>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-6 py-8 space-y-6">
        {/* User Info Card */}
        <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4A853] to-[#B08A3E] flex items-center justify-center">
              <span className="text-2xl font-bold text-[#0C1222]">{(user?.email?.charAt(0) || 'U').toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#F5F5F0]">{userName}</h2>
              <p className="text-sm text-[#F5F5F0]/40 mt-1">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">Verified</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-[#F5F5F0]/30 font-medium">{profile?.kyc_status || 'Basic'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#D4A853]/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#D4A853]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#F5F5F0]">Change Password</h3>
              <p className="text-xs text-[#F5F5F0]/40">Update your account password</p>
            </div>
          </div>

          {pwdSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-400">{pwdSuccess}</p>
            </div>
          )}
          {pwdError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-sm text-red-400">{pwdError}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5F5F0]/30 hover:text-[#F5F5F0]/60">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters" minLength={8} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5F5F0]/30 hover:text-[#F5F5F0]/60">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#F5F5F0]/40 uppercase tracking-wider mb-2 block">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F5F0]/30" />
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" minLength={8} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3.5 text-sm text-[#F5F5F0] placeholder:text-[#F5F5F0]/20 focus:border-[#D4A853]/50 outline-none" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5F5F0]/30 hover:text-[#F5F5F0]/60">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={pwdLoading || !newPassword || !confirmPassword} className="w-full py-3.5 rounded-xl bg-[#D4A853] text-[#0C1222] font-semibold hover:bg-[#D4A853]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {pwdLoading ? 'Updating...' : <><Lock className="w-4 h-4" /> Update Password</>}
            </button>
          </form>
        </div>

        {/* Notification Preferences */}
        <div className="bg-gradient-to-br from-[#1B2132] to-[#14192A] rounded-3xl p-8 border border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#F5F5F0]">Notification Preferences</h3>
              <p className="text-xs text-[#F5F5F0]/40">Control what alerts you receive</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Email Alerts', desc: 'Receive email notifications for transfers', checked: emailAlerts, onChange: setEmailAlerts },
              { label: 'Transfer Notifications', desc: 'In-app alerts for sent and received money', checked: transferAlerts, onChange: setTransferAlerts },
              { label: 'Security Alerts', desc: 'Login and security-related notifications', checked: securityAlerts, onChange: setSecurityAlerts },
            ].map(item => (
              <label key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-all">
                <div>
                  <p className="text-sm font-medium text-[#F5F5F0]">{item.label}</p>
                  <p className="text-xs text-[#F5F5F0]/30 mt-0.5">{item.desc}</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-all relative ${item.checked ? 'bg-[#D4A853]' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${item.checked ? 'left-[22px]' : 'left-0.5'}`} />
                  <input type="checkbox" checked={item.checked} onChange={e => item.onChange(e.target.checked)} className="sr-only" />
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-gradient-to-br from-emerald-500/5 to-[#14192A] rounded-3xl p-8 border border-emerald-500/10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-emerald-400">Security Status</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Email Authentication', status: 'Active' },
              { label: 'Two-Factor Authentication', status: 'Available' },
              { label: 'Account Status', status: 'Active' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-[#F5F5F0]/60">{item.label}</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${item.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-[#F5F5F0]/40'}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
