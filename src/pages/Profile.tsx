import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/database';
import { User, Mail, Phone, Globe, DollarSign, Save, LogOut, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, profile, isLoading: authLoading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
      setCountry(profile.country || '');
      setCurrency(profile.currency || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { first_name: firstName, last_name: lastName, phone, country, currency });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-deep-blue flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-soft-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen bg-deep-blue pt-24 pb-16">
      <div className="content-max container-padding max-w-xl mx-auto">
        <h1 className="text-[clamp(36px,4vw,64px)] font-medium leading-tight tracking-[-0.03em] text-[#F5F5F0]">
          Profile
        </h1>
        <p className="text-base text-[rgba(245,245,240,0.55)] mt-2">
          Manage your account settings
        </p>

        {/* Profile Card */}
        <div className="bg-surface rounded-2xl p-8 mt-8 text-center">
          <div className="w-20 h-20 rounded-full bg-soft-amber flex items-center justify-center mx-auto">
            <span className="text-2xl font-semibold text-deep-blue">
              {(profile.first_name?.[0] || 'U').toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-medium text-[#F5F5F0] mt-4">
            {profile.first_name} {profile.last_name}
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Mail className="w-4 h-4 text-[rgba(245,245,240,0.35)]" />
            <span className="text-sm text-[rgba(245,245,240,0.55)]">{user.email}</span>
          </div>
          <p className="text-sm text-[rgba(245,245,240,0.35)] font-mono mt-2">
            Account: {profile.account?.account_number || 'N/A'}
          </p>
        </div>

        {/* Edit Form */}
        <div className="bg-surface rounded-2xl p-8 mt-6">
          <h3 className="text-lg font-medium text-[#F5F5F0] mb-6">Edit Profile</h3>

          {saved && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" /> Profile updated successfully
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium tracking-wide uppercase text-[rgba(245,245,240,0.35)]">First Name</label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,240,0.35)]" />
                  <input
                    type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    className="w-full bg-glass border border-input-border rounded-lg pl-10 pr-4 py-3 text-sm text-[#F5F5F0] focus:border-soft-amber focus:ring-1 focus:ring-soft-amber/20 transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium tracking-wide uppercase text-[rgba(245,245,240,0.35)]">Last Name</label>
                <input
                  type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full mt-1.5 bg-glass border border-input-border rounded-lg px-4 py-3 text-sm text-[#F5F5F0] focus:border-soft-amber focus:ring-1 focus:ring-soft-amber/20 transition-all outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium tracking-wide uppercase text-[rgba(245,245,240,0.35)]">Phone</label>
              <div className="relative mt-1.5">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,240,0.35)]" />
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full bg-glass border border-input-border rounded-lg pl-10 pr-4 py-3 text-sm text-[#F5F5F0] focus:border-soft-amber focus:ring-1 focus:ring-soft-amber/20 transition-all outline-none"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium tracking-wide uppercase text-[rgba(245,245,240,0.35)]">Country</label>
                <div className="relative mt-1.5">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,240,0.35)]" />
                  <select
                    value={country} onChange={e => setCountry(e.target.value)}
                    className="w-full bg-glass border border-input-border rounded-lg pl-10 pr-4 py-3 text-sm text-[#F5F5F0] focus:border-soft-amber focus:ring-1 focus:ring-soft-amber/20 transition-all outline-none appearance-none"
                  >
                    <option value="" className="bg-surface">Select</option>
                    <option value="US" className="bg-surface">🇺🇸 United States</option>
                    <option value="GB" className="bg-surface">🇬🇧 United Kingdom</option>
                    <option value="EU" className="bg-surface">🇪🇺 European Union</option>
                    <option value="NG" className="bg-surface">🇳🇬 Nigeria</option>
                    <option value="IN" className="bg-surface">🇮🇳 India</option>
                    <option value="BR" className="bg-surface">🇧🇷 Brazil</option>
                    <option value="GH" className="bg-surface">🇬🇭 Ghana</option>
                    <option value="KE" className="bg-surface">🇰🇪 Kenya</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium tracking-wide uppercase text-[rgba(245,245,240,0.35)]">Currency</label>
                <div className="relative mt-1.5">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,240,0.35)]" />
                  <select
                    value={currency} onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-glass border border-input-border rounded-lg pl-10 pr-4 py-3 text-sm text-[#F5F5F0] focus:border-soft-amber focus:ring-1 focus:ring-soft-amber/20 transition-all outline-none appearance-none"
                  >
                    <option value="USD" className="bg-surface">USD — US Dollar</option>
                    <option value="EUR" className="bg-surface">EUR — Euro</option>
                    <option value="GBP" className="bg-surface">GBP — British Pound</option>
                    <option value="NGN" className="bg-surface">NGN — Nigerian Naira</option>
                  </select>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-soft-amber text-deep-blue font-semibold hover:shadow-glow transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Security */}
        <div className="bg-surface rounded-2xl p-8 mt-6">
          <h3 className="text-lg font-medium text-[#F5F5F0] mb-6">Security</h3>
          <div className="space-y-3">
            <button className="w-full py-3 rounded-lg border border-[rgba(245,245,240,0.15)] text-[rgba(245,245,240,0.7)] text-sm font-medium hover:bg-white/5 transition-all">
              Change Password
            </button>
            <button
              onClick={handleSignOut}
              className="w-full py-3 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
