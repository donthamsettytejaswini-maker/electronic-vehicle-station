import React from 'react';
import { useForm } from 'react-hook-form';
import { Car, Zap, BatteryCharging, Hash, Calendar, Palette, Check } from 'lucide-react';
import ErrorMessage from './ErrorMessage';

const CONNECTOR_OPTIONS = ['CCS2', 'Type 2', 'CHAdeMO', 'GB/T', 'Other'];

const VehicleForm = ({
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
      vehicleNumber: initialData?.vehicleNumber || '',
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      manufacturingYear: initialData?.manufacturingYear || '',
      batteryCapacity: initialData?.batteryCapacity || '',
      connectorType: initialData?.connectorType || 'CCS2',
      maxChargingPower: initialData?.maxChargingPower || '',
      color: initialData?.color || '',
      isDefault: initialData?.isDefault || false,
    },
  });

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm max-w-2xl mx-auto">
      <ErrorMessage
        message={serverError}
        errors={fieldErrors}
        onClose={onClearErrors}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Vehicle Number */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Vehicle Registration Number <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. AP09AB1234 / KA01EQ9999"
                className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.vehicleNumber
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-slate-300 focus:border-emerald-500'
                } uppercase tracking-wider font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('vehicleNumber', {
                  required: 'Vehicle registration number is required',
                  minLength: {
                    value: 3,
                    message: 'Must be at least 3 characters',
                  },
                })}
              />
            </div>
            {errors.vehicleNumber && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {errors.vehicleNumber.message}
              </p>
            )}
          </div>

          {/* Brand */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Brand / Manufacturer <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Car className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. Tata, MG, Hyundai"
                className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.brand
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-slate-300 focus:border-emerald-500'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('brand', {
                  required: 'Brand is required',
                })}
              />
            </div>
            {errors.brand && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {errors.brand.message}
              </p>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Nexon EV, ZS EV, Ioniq 5"
              className={`block w-full px-3 py-2.5 sm:text-sm rounded-xl border ${
                errors.model
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-slate-300 focus:border-emerald-500'
              } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
              {...register('model', {
                required: 'Model is required',
              })}
            />
            {errors.model && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {errors.model.message}
              </p>
            )}
          </div>

          {/* Battery Capacity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Battery Capacity (kWh) <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <BatteryCharging className="w-4 h-4" />
              </div>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 40.5"
                className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border ${
                  errors.batteryCapacity
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-slate-300 focus:border-emerald-500'
                } focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900`}
                {...register('batteryCapacity', {
                  required: 'Battery capacity is required',
                  min: {
                    value: 1,
                    message: 'Battery capacity must be at least 1 kWh',
                  },
                })}
              />
            </div>
            {errors.batteryCapacity && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {errors.batteryCapacity.message}
              </p>
            )}
          </div>

          {/* Connector Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Connector Type <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Zap className="w-4 h-4" />
              </div>
              <select
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('connectorType', {
                  required: 'Connector type is required',
                })}
              >
                {CONNECTOR_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Charging Power */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Max Charging Power (kW) <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 50"
              className="block w-full px-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
              {...register('maxChargingPower', {
                min: {
                  value: 1,
                  message: 'Must be at least 1 kW',
                },
              })}
            />
          </div>

          {/* Manufacturing Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Manufacturing Year <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
              <input
                type="number"
                placeholder={`e.g. ${new Date().getFullYear()}`}
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('manufacturingYear', {
                  min: {
                    value: 1990,
                    message: 'Year must be after 1990',
                  },
                  max: {
                    value: new Date().getFullYear() + 1,
                    message: 'Invalid future year',
                  },
                })}
              />
            </div>
          </div>

          {/* Color */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Vehicle Color <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Palette className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. Glacier White, Midnight Blue"
                className="block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-xl border border-slate-300 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white text-slate-900"
                {...register('color')}
              />
            </div>
          </div>

          {/* Set as Default Checkbox */}
          <div className="sm:col-span-2 pt-2">
            <label className="inline-flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                {...register('isDefault')}
              />
              <span className="text-xs font-semibold text-slate-700">
                Set as default primary vehicle for slot reservations
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Vehicle...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{initialData ? 'Update Vehicle' : 'Save Vehicle'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;
