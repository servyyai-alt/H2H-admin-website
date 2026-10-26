import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Package, Lock, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { adminService } from '../../services/admin.service';

export const SetupPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [candidateInfo, setCandidateInfo] = useState<{ name: string; email: string; designation: string } | null>(null);
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successResult, setSuccessResult] = useState<{ message: string; approvalStatus: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('No invitation token provided in the link. Please check your invitation URL.');
      return;
    }

    adminService.verifyInvitation(token)
      .then(res => {
        setTokenValid(true);
        setCandidateInfo(res.data.user);
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { error?: { message?: string } } } };
        setTokenValid(false);
        setTokenError(e.response?.data?.error?.message || 'This invitation link is invalid or has expired. Please contact your Super Admin for a new invitation.');
      })
      .finally(() => {
        setVerifying(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setSubmitError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await adminService.acceptInvitation(token, password);
      setSuccessResult({
        message: res.message,
        approvalStatus: res.data?.approvalStatus || 'PENDING',
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      setSubmitError(e.response?.data?.error?.message || 'Failed to set password. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Hand2Hand Delivery"
            className="h-14 w-auto object-contain mx-auto mb-3 drop-shadow-sm"
          />
          <h1 className="text-xl font-bold text-gray-900">Hand2Hand Delivery</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Portal Setup</p>
        </div>

        <div className="card">
          {verifying ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500">Verifying your invitation link...</p>
            </div>
          ) : !tokenValid ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Invitation Link Expired or Invalid</h2>
              <p className="text-xs text-gray-600 px-4">{tokenError}</p>
              <div className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="btn-secondary text-xs"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          ) : successResult ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Password Set Successfully!</h2>
              <p className="text-xs text-gray-600 px-2 leading-relaxed">
                {successResult.message}
              </p>
              {successResult.approvalStatus === 'PENDING' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-left">
                  <p className="font-semibold mb-0.5">Approval Notice:</p>
                  <p>
                    Your administrator account is awaiting review and activation by the Super Admin. You will be able to log in once approval is completed.
                  </p>
                </div>
              )}
              <div className="pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary w-full text-xs"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-base font-bold text-gray-900">Welcome, {candidateInfo?.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  You have been invited as <strong>{candidateInfo?.designation || 'Administrator'}</strong>. Set your password below to continue.
                </p>
              </div>

              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">New Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 chars, uppercase, lowercase, number"
                      className="input text-xs pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="input text-xs"
                  />
                </div>

                <div className="p-3 bg-gray-50 rounded-lg text-[11px] text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">Password requirements:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                    <li className={password.length >= 8 ? 'text-green-600 font-medium' : ''}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600 font-medium' : ''}>At least one uppercase letter</li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600 font-medium' : ''}>At least one lowercase letter</li>
                    <li className={/\d/.test(password) ? 'text-green-600 font-medium' : ''}>At least one number</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-xs flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Setting Password...</>
                  ) : (
                    'Set Password & Complete Setup'
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
