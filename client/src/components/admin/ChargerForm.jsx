import React from 'react';
import { useForm } from 'react-hook-form';
import { Zap, Gauge, DollarSign, Check, Hash } from 'lucide-react';
import ErrorMessage from '../ErrorMessage';

const CONNECTOR_OPTIONS = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Other'];
const SPEED_OPTIONS = ['Slow', 'Normal', 'Fast', 'Rapid'];
const STATUS_OPTIONS = ['available', 'reserved', 'charging', 'maintenance', 'offline'];

const ChargerForm = ({
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
      chargerNumber: initialData?.chargerNumber || '',
      connectorType: initialData?.connectorType || 'CCS2',
      chargingSpeed: initialData?.chargingSpeed || 'Fast',
      powerRating: initialData?.powerRating || '',
      pricePerKwh: initialData?.pricePerKwh !== undefined ? initialData.pricePerKwh : '',
      status: initialData?.status || 'available',
      description: initialData?.description || '',
    },
  });

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-xl mx-auto">
      <ErrorMessage
        message={serverError}
        errors={fieldErrors}
        onClose={onClearErrors}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Charger Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Charger Bay Number / ID <span className="text-red-500">*</span>
          </label>
          <div className="relative rounded-xl shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Hash className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="e.g. CH-01 / DC-BAY-02"
              className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                errors.chargerNumber ? 'border-red-300' : 'border-slate-300'
              } font-mono uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
              {...register('chargerNumber', {
                required: 'Charger number is required',
              })}
            />
          </div>
          {errors.chargerNumber && (
            <p className="mt-1 text-xs text-red-600 font-medium">
              {errors.chargerNumber.message}
            </p>
          )}
        </div>

        {/* Connector Type & Speed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Connector Type <span className="text-red-500">*</span>
            </label>
            <select
              className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
              {...register('connectorType', {
                required: 'Connector type is required',
              })}
            >
              {CONNECTOR_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Charging Speed <span className="text-red-500">*</span>
            </label>
            <select
              className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
              {...register('chargingSpeed', {
                required: 'Charging speed is required',
              })}
            >
              {SPEED_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Power Rating & Custom Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Power Rating (kW) <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Gauge className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 60"
                className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.powerRating ? 'border-red-300' : 'border-slate-300'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('powerRating', {
                  required: 'Power rating is required',
                  min: { value: 1, message: 'Must be at least 1 kW' },
                })}
              />
            </div>
            {errors.powerRating && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {errors.powerRating.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Custom Rate (₹/kWh) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="Default to station rate"
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('pricePerKwh', {
                  min: { value: 0, message: 'Price cannot be negative' },
                })}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Initial Status
          </label>
          <select
            className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
            {...register('status')}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt} className="capitalize">
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Description <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Dual CCS2 fast output with dedicated parking spot"
            className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
            {...register('description')}
          />
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Charger...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{initialData ? 'Update Charger' : 'Add Charger'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChargerForm;
