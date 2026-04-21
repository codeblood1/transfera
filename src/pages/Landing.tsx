import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import HeroSection from '@/sections/HeroSection';
import FeaturesSection from '@/sections/FeaturesSection';
import ConverterSection from '@/sections/ConverterSection';
import DestinationsSection from '@/sections/DestinationsSection';
import SecuritySection from '@/sections/SecuritySection';
import SupportSection from '@/sections/SupportSection';
import CTASection from '@/sections/CTASection';
import FooterSection from '@/sections/FooterSection';

type AuthModal = 'login' | 'signup' | null;

export default function Landing() {
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modal, setModal] = useState<AuthModal>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Listen for URL-based modal triggers (from Navigation)
  useEffect(() => {
    if (searchParams.get('signup') === 'true') {
      setModal('signup');
      setSearchParams({});
    } else if (searchParams.get('login') === 'true') {
      setModal('login');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const openSignup = useCallback(() => {
    setModal('signup');
    setError('');
    setSuccess('');
  }, []);

  const openLogin = useCallback(() => {
    setModal('login');
    setError('');
    setSuccess('');
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setError('');
    setSuccess('');
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      setSuccess('Check your email to confirm your account!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      closeModal();
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="bg-deep-blue min-h-screen">
      <HeroSection onOpenSignup={openSignup} onOpenLogin={openLogin} />
      <FeaturesSection />
      <ConverterSection onOpenSignup={openSignup} />
      <DestinationsSection />
      <SecuritySection />
      <SupportSection />
      <CTASection onOpenSignup={openSignup} />
      <FooterSection />

      {/* Auth Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-surface rounded-2xl border border-white/10 w-full max-w-md p-8 shadow-card">
            <button onClick={closeModal} className="absolute top-4 right-4 text-[rgba(245,245,240,0.45)] hover:text-[#F5F5F0] transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-medium text-[#F5F5F0] tracking-tight">
              {modal === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-[rgba(245,245,240,0.45)] mt-2">
              {modal === 'signup'
                ? 'Start sending money securely today.'
                : 'Sign in to your Transfera account.'}
            </p>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                {success}
              </div>
            )}

            <form onSubmit={modal === 'signup' ? handleSignUp : handleSignIn} className="mt-6 space-y-4">
              {modal === 'signup' && (
                <div>
                  <label className="text-xs font-medium tracking-wide uppercase text-[rgba(245,245,240,0.45)]">Full Name</label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,240,0.35)]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-glass border border-input-border rounded-lg pl-10 pr-4 py-3 text-sm text-[#F5F5F0] placeholder:text-[rgba(245,245,240,0.25)] focus:border-soft-amber focus:ring-1 focus:ring-soft-amber/20 transition-all outline-none"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium tracking-wide uppercase text-[rgba(245,245,240,0.45)]">Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,240,0.35)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-glass border border-input-border rounded-lg pl-10 pr-4 py-3 text-sm text-[#F5F5F0] placeholder:text-[rgba(245,245,240,0.25)] focus:border-soft-amber focus:ring-1 focus:ring-soft-amber/20 transition-all outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium tracking-wide uppercase text-[rgba(245,245,240,0.45)]">Password</label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(245,245,240,0.35)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-glass border border-input-border rounded-lg pl-10 pr-4 py-3 text-sm text-[#F5F5F0] placeholder:text-[rgba(245,245,240,0.25)] focus:border-soft-amber focus:ring-1 focus:ring-soft-amber/20 transition-all outline-none"
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg bg-soft-amber text-deep-blue font-semibold hover:shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Please wait...' : modal === 'signup' ? 'Create Account' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="text-center text-sm text-[rgba(245,245,240,0.45)] mt-5">
              {modal === 'signup' ? (
                <>Already have an account?{' '}
                  <button onClick={openLogin} className="text-soft-amber hover:underline">
                    Sign in
                  </button>
                </>
              ) : (
                <>Don't have an account?{' '}
                  <button onClick={openSignup} className="text-soft-amber hover:underline">
                    Create one
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
