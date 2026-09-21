import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ShieldCheck, Zap, Sparkles, UserCheck, Trash2, Edit2 } from 'lucide-react';
import reviewService from '../../services/reviewService';
import { useAuth } from '../../context/AuthContext';

export const ReviewList = ({ stationId, refreshTrigger }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewService.getStationReviews(stationId);
      if (res.success) {
        setReviews(res.data);
      }
    } catch (err) {
      setError('Failed to load station reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stationId) {
      fetchReviews();
    }
  }, [stationId, refreshTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await reviewService.deleteReview(id);
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  // Calculate aggregates
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1)
    : '0.0';

  const avgSpeed = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.chargingSpeedRating || r.rating || 0), 0) / totalReviews).toFixed(1)
    : '0.0';

  const avgAvail = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.availabilityRating || r.rating || 0), 0) / totalReviews).toFixed(1)
    : '0.0';

  const avgClean = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.cleanlinessRating || r.rating || 0), 0) / totalReviews).toFixed(1)
    : '0.0';

  const avgStaff = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (r.staffRating || r.rating || 0), 0) / totalReviews).toFixed(1)
    : '0.0';

  const CategoryScore = ({ label, score, icon: Icon }) => (
    <div className="flex items-center justify-between text-xs py-1">
      <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
        <Icon className="w-3.5 h-3.5 text-emerald-500" />
        <span>{label}</span>
      </div>
      <div className="flex items-center space-x-1 font-bold text-slate-800 dark:text-slate-200">
        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
        <span>{score}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Review Summary Header */}
      <div className="p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Main Average Score */}
          <div className="text-center md:border-r md:border-slate-100 dark:md:border-slate-700/60 pr-0 md:pr-6">
            <div className="text-4xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center space-x-2">
              <span>{avgRating}</span>
              <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Based on {totalReviews} verified reviews</p>
          </div>

          {/* Category Breakdown */}
          <div className="col-span-2 space-y-1">
            <CategoryScore label="Charging Speed" score={avgSpeed} icon={Zap} />
            <CategoryScore label="Charger Availability" score={avgAvail} icon={ShieldCheck} />
            <CategoryScore label="Cleanliness & Safety" score={avgClean} icon={Sparkles} />
            <CategoryScore label="Staff & Facility Support" score={avgStaff} icon={UserCheck} />
          </div>
        </div>
      </div>

      {/* Review Items */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">
          Loading station reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No reviews yet</p>
          <p className="text-xs text-slate-500 mt-0.5">Complete a charging session at this station to leave your review!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const isAuthor = user && (rev.userId?._id === user._id || rev.userId === user._id);
            const authorName = rev.userId?.name || 'Verified EV Driver';

            return (
              <div
                key={rev._id}
                className="p-5 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{authorName}</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          Verified Session
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/40">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{rev.rating}.0</span>
                    </div>

                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(rev._id)}
                        title="Delete review"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                    "{rev.comment}"
                  </p>
                )}

                {/* Sub-ratings badge list */}
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    ⚡ Speed: <strong>{rev.chargingSpeedRating || rev.rating}/5</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    🛡️ Availability: <strong>{rev.availabilityRating || rev.rating}/5</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    ✨ Cleanliness: <strong>{rev.cleanlinessRating || rev.rating}/5</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    👥 Staff: <strong>{rev.staffRating || rev.rating}/5</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewList;
