import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Image,
  Save,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [serverError, setServerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      avatar: user?.avatar || '',
    },
  });

  // Keep form updated if user changes in context
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setServerError('');
    setFieldErrors([]);
    setSuccessMessage('');
    setIsSaving(true);

    const result = await updateProfile({
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
    });

    setIsSaving(false);

    if (result.success) {
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setServerError(result.message || 'Failed to update profile');
      setFieldErrors(result.errors || []);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-950">Account Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          View your registered EV account details and update your personal info.
        </p>
      </div>

      <ErrorMessage
        message={serverError}
        errors={fieldErrors}
        onClose={() => {
          setServerError('');
          setFieldErrors([]);
        }}
      />

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-100 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-bold text-3xl flex items-center justify-center shadow-md shadow-emerald-600/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span
              className={`absolute bottom-0 right-0 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border shadow-sm ${
                user?.role === 'admin'
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-slate-800 text-white border-slate-900'
              }`}
            >
              {user?.role || 'user'}
            </span>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-left text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Role:
              </span>
              <span className="font-semibold capitalize text-slate-800">
                {user?.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Member Since:
              </span>
              <span className="font-medium text-slate-700">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Form */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">
              Personal Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Update your contact details. Email and Role cannot be modified in Phase 1.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name (Editable) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'
                  } focus:outline-none focus:ring-1 bg-white text-slate-900 placeholder:text-slate-400`}
                  {...register('name', {
                    required: 'Name cannot be empty',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email (Read-Only) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email Address
                </label>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                  <Lock className="w-3 h-3" /> Locked in Phase 1
                </span>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Phone (Editable) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none focus:ring-1 bg-white text-slate-900 placeholder:text-slate-400"
                  {...register('phone')}
                />
              </div>
            </div>

            {/* Avatar URL (Editable) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Avatar Image URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Image className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  className="block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 focus:outline-none focus:ring-1 bg-white text-slate-900 placeholder:text-slate-400"
                  {...register('avatar')}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !isDirty}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
