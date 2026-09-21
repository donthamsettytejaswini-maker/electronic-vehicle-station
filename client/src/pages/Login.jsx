import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  const { login: loginAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('session_expired') === 'true') {
      setSessionExpiredNotice(true);
    }
  }, [location]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onTouched',
  });

  const onSubmit = async (data) => {
    setServerError('');
    setFieldErrors([]);
    setSessionExpiredNotice(false);
    setIsSubmitting(true);

    const result = await loginAuth({
      email: data.email,
      password: data.password,
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      const { user } = result.data;
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      setServerError(result.message || 'Login failed. Please check your credentials.');
      setFieldErrors(result.errors || []);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Welcome back</h2>
        <p className="text-xs text-slate-500 mt-1">
          Sign in to access your EV charging portal.
        </p>
      </div>

      {sessionExpiredNotice && (
        <div className="p-3 mb-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Your session has expired. Please sign in again to continue.</span>
        </div>
      )}

      <ErrorMessage
        message={serverError}
        errors={fieldErrors}
        onClose={() => {
          setServerError('');
          setFieldErrors([]);
        }}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              placeholder="name@example.com"
              className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
              } focus:outline-none focus:ring-1 bg-white text-slate-900 placeholder:text-slate-400`}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Please enter a valid email address',
                },
              })}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className={`block w-full pl-10 pr-10 py-2.5 sm:text-sm rounded-xl border ${
                errors.password
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
              } focus:outline-none focus:ring-1 bg-white text-slate-900 placeholder:text-slate-400`}
              {...register('password', {
                required: 'Password is required',
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Quick Demo Credentials Reminder */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
          <p className="font-semibold text-slate-700">Developer Testing Account:</p>
          <div className="flex justify-between text-slate-500">
            <span>Admin: <strong className="text-slate-700">admin@evcharge.com</strong></span>
            <span>Pass: <strong className="text-slate-700">Admin@123</strong></span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Register link */}
      <div className="mt-6 text-center text-xs text-slate-600 border-t border-slate-100 pt-4">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
};

export default Login;
