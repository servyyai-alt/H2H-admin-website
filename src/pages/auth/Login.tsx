import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Eye, EyeOff, Lock, Mail, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { useAppDispatch } from '../../hooks/useAppSelector';
import { setCredentials } from '../../store/slices/authSlice';
import { authService } from '../../services/auth.service';

export const Login: React.FC = () => {
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(phone, password);
      if (!['ADMIN','SUPER_ADMIN'].includes(res.data.user.role)) {
        setError('Access denied. Admin accounts only.');
        return;
      }
      dispatch(setCredentials({
        user: res.data.user,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      }));
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setError(e.response?.data?.error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between items-center px-4 py-8 sm:px-6 relative overflow-hidden">
      {/* Subtle brand ambient accents */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Login Box */}
      <div className="w-full max-w-[420px] mx-auto my-auto relative z-10 py-4 sm:py-6">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/70 mb-3 sm:mb-4 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Staff Access Only</span>
          </div>
          <img
            src="/logo.png"
            alt="Hand2Hand Delivery"
            className="h-16 w-auto object-contain mx-auto mb-3 drop-shadow-sm"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Hand2Hand Admin</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Sign in to manage operations, orders & fleet</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 p-5 sm:p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200/80 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2.5 shadow-sm animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="leading-snug text-xs sm:text-sm font-medium">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Email or Phone number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="admin@h2h.com or 10-digit mobile"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-150"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 bg-gray-50/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-150"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-sm font-semibold rounded-xl shadow-md shadow-brand-600/20 hover:shadow-lg hover:shadow-brand-600/30 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer info text */}
        <p className="text-center text-xs text-gray-400 mt-6 sm:mt-8 tracking-wide">
          Hand2Hand Delivery · Vellore, Tamil Nadu
        </p>
      </div>
    </div>
  );
};
