import React, { useState } from 'react';
import { Star, X, Zap, ShieldCheck, Sparkles, UserCheck, MessageSquare } from 'lucide-react';
import reviewService from '../../services/reviewService';

export const ReviewFormModal = ({ isOpen, onClose, stationId, bookingId, sessionId, stationName, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [chargingSpeedRating, setChargingSpeedRating] = useState(5);
  const [availabilityRating, setAvailabilityRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [staffRating, setStaffRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await reviewService.createReview({
        stationId,
        bookingId,
        sessionId,
        rating,
        chargingSpeedRating,
        availabilityRating,
        cleanlinessRating,
        staffRating,
        comment,
      });

      if (res.success) {
        if (onReviewSubmitted) onReviewSubmitted(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review. You may have already reviewed this session.');
    } finally {
      setSubmitting(false);
    }
  };

  const StarPicker = ({ value, onChange, label, icon: Icon }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 text-sm font-medium">
        {Icon && <Icon className="w-4 h-4 text-emerald-500" />}
        <span>{label}</span>
      </div>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => onChange(star)}
            className="p-1 text-slate-300 hover:text-amber-400 focus:outline-hidden transition"
          >
            <Star
              className={`w-5 h-5 ${
                star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review Your Experience</h3>
            <p className="text-xs text-slate-500 mt-1">
              Station: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stationName || 'Charging Station'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Overall Rating Hero */}
          <div className="text-center py-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Overall Rating</span>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-hidden transition transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="space-y-1">
            <StarPicker
              label="Charging Speed"
              value={chargingSpeedRating}
              onChange={setChargingSpeedRating}
              icon={Zap}
            />
            <StarPicker
              label="Charger Availability"
              value={availabilityRating}
              onChange={setAvailabilityRating}
              icon={ShieldCheck}
            />
            <StarPicker
              label="Cleanliness & Safety"
              value={cleanlinessRating}
              onChange={setCleanlinessRating}
              icon={Sparkles}
            />
            <StarPicker
              label="Staff & Support"
              value={staffRating}
              onChange={setStaffRating}
              icon={UserCheck}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Feedback & Comments (Optional)</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other EV drivers how your charging experience went..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
            />
            <div className="text-right text-[10px] text-slate-400 mt-0.5">{comment.length}/500</div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewFormModal;
