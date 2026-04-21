import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X, LogOut, User, CreditCard, ArrowUpRight } from 'lucide-react';

export default function Navigation() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setDropdownOpen(false);
    navigate('/');
  };

  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/transfers') || location.pathname === '/profile';
  // Hide landing-page section links when user is logged in (dashboard/profile pages)
  const showSectionLinks = !user && !isDashboard;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300 ${
        scrolled || isDashboard
          ? 'bg-[rgba(12,18,34,0.9)] backdrop-blur-xl border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="content-max w-full flex items-center justify-between container-padding">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-soft-amber flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 text-deep-blue" />
          </div>
          <span className="text-lg font-medium text-[#F5F5F0]">Transfera</span>
        </Link>

        {/* Desktop Nav — section links only when NOT logged in */}
        {showSectionLinks && (
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', id: 'features' },
              { label: 'Destinations', id: 'destinations' },
              { label: 'Security', id: 'security' },
              { label: 'Support', id: 'support' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="text-xs font-medium tracking-[0.12em] uppercase text-[rgba(245,245,240,0.55)] hover:text-[#F5F5F0] transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface hover:bg-surface-light transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-soft-amber flex items-center justify-center">
                  <span className="text-xs font-semibold text-deep-blue">
                    {(profile?.first_name?.[0] || 'U').toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-[#F5F5F0]">{profile?.first_name || 'User'}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-card py-2">
                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[rgba(245,245,240,0.75)] hover:text-[#F5F5F0] hover:bg-white/5 transition-colors">
                    <CreditCard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[rgba(245,245,240,0.75)] hover:text-[#F5F5F0] hover:bg-white/5 transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <div className="border-t border-white/10 my-1" />
                  <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors w-full">
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => navigate('/?login=true')} className="text-sm text-[rgba(245,245,240,0.75)] hover:text-[#F5F5F0] transition-colors">
                Log In
              </button>
              <Link to="/?signup=true" className="px-5 py-2 rounded-full bg-soft-amber text-deep-blue text-sm font-semibold hover:shadow-glow transition-all hover:-translate-y-0.5">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-[#F5F5F0]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-deep-blue/95 backdrop-blur-xl border-b border-white/10 py-6 md:hidden">
          <div className="container-padding flex flex-col gap-4">
            {showSectionLinks && [
              { label: 'Features', id: 'features' },
              { label: 'Destinations', id: 'destinations' },
              { label: 'Security', id: 'security' },
              { label: 'Support', id: 'support' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => { document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); setMobileOpen(false); }}
                className="text-left text-sm text-[rgba(245,245,240,0.75)] hover:text-[#F5F5F0] transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="border-t border-white/10 pt-4">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm text-[rgba(245,245,240,0.75)] block py-2">Dashboard</Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-sm text-[rgba(245,245,240,0.75)] block py-2">Profile</Link>
                  <button onClick={() => { handleSignOut(); setMobileOpen(false); }} className="text-sm text-red-400 py-2">Log Out</button>
                </>
              ) : (
                <Link to="/?signup=true" onClick={() => setMobileOpen(false)} className="inline-block px-5 py-2 rounded-full bg-soft-amber text-deep-blue text-sm font-semibold">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
