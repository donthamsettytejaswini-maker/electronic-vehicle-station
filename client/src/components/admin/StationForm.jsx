import React from 'react';
import { useForm } from 'react-hook-form';
import {
  MapPin,
  DollarSign,
  Clock,
  Phone,
  Image,
  Check,
  Building,
  Navigation,
} from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

const FACILITY_OPTIONS = ['Parking', 'Restroom', 'Cafe', 'WiFi', 'Security'];

const StationForm = ({
  initialData,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  onClearErrors,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      address: initialData?.address || '',
      city: initialData?.city || '',
      state: initialData?.state || '',
      postalCode: initialData?.postalCode || '',
      latitude: initialData?.latitude || '',
      longitude: initialData?.longitude || '',
      pricePerKwh: initialData?.pricePerKwh || '',
      operatingHours: initialData?.operatingHours || '24 hours',
      phone: initialData?.phone || '',
      facilities: initialData?.facilities || ['Parking'],
      status: initialData?.status || 'active',
      image: initialData?.image || '',
    },
  });

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-3xl mx-auto">
      <ErrorMessage
        message={serverError}
        errors={fieldErrors}
        onClose={onClearErrors}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            Station Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Station Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. ABC Fast EV Hub"
                className={`block w-full px-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.name ? 'border-red-300' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('name', { required: 'Station name is required' })}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Provide details about station amenities and landmark location..."
                className="block w-full px-3 py-2 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('description')}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Location & Address */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-600" />
            Location & Coordinates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. MG Road, Near Benz Circle"
                className={`block w-full px-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.address ? 'border-red-300' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('address', { required: 'Address is required' })}
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Vijayawada"
                className={`block w-full px-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.city ? 'border-red-300' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('city', { required: 'City is required' })}
              />
              {errors.city && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State
              </label>
              <input
                type="text"
                placeholder="e.g. Andhra Pradesh"
                className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('state')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Postal Code
              </label>
              <input
                type="text"
                placeholder="e.g. 520010"
                className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('postalCode')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Latitude <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                placeholder="e.g. 16.5062"
                className={`block w-full px-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.latitude ? 'border-red-300' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('latitude', {
                  required: 'Latitude is required',
                  min: { value: -90, message: 'Latitude must be between -90 and 90' },
                  max: { value: 90, message: 'Latitude must be between -90 and 90' },
                })}
              />
              {errors.latitude && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.latitude.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Longitude <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.000001"
                placeholder="e.g. 80.6480"
                className={`block w-full px-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.longitude ? 'border-red-300' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('longitude', {
                  required: 'Longitude is required',
                  min: { value: -180, message: 'Longitude must be between -180 and 180' },
                  max: { value: 180, message: 'Longitude must be between -180 and 180' },
                })}
              />
              {errors.longitude && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.longitude.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Pricing, Operations & Status */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Pricing & Operations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Base Price (₹ / kWh) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 15.0"
                className={`block w-full px-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.pricePerKwh ? 'border-red-300' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('pricePerKwh', {
                  required: 'Price per kWh is required',
                  min: { value: 0, message: 'Price cannot be negative' },
                })}
              />
              {errors.pricePerKwh && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.pricePerKwh.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Operating Hours <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 24 hours / 6AM - 11PM"
                className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('operatingHours', { required: 'Operating hours is required' })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('phone')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('status')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Image Banner URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('image')}
              />
            </div>
          </div>

          {/* Facilities Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Available Facilities
            </label>
            <div className="flex flex-wrap gap-4">
              {FACILITY_OPTIONS.map((facility) => (
                <label key={facility} className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    value={facility}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    {...register('facilities')}
                  />
                  <span>{facility}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex items-center justify-end border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Station...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{initialData ? 'Update Station' : 'Create Station'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StationForm;
