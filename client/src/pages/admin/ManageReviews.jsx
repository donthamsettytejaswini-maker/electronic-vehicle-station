import React, { useState, useEffect } from 'react';
import { 
  Star, ShieldAlert, Check, X, Trash2, Eye, 
  MessageSquare, RefreshCw, AlertTriangle, Sparkles 
} from 'lucide-react';
import reviewService from '../../services/reviewService';

export const ManageReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAdminReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewService.getAllAdminReviews();
      if (res.success) {
        setReviews(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReviews();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await reviewService.moderateReview(id, status);
      setReviews(prev =>
        prev.map(r => r._id === id ? { ...r, status } : r)
      );
    } catch (err) {
      alert('Failed to update review status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await reviewService.deleteReview(id);
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert('Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter(r =>
    filterStatus === 'all' ? true : r.status === filterStatus
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'hidden':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
            <span>Station Review Moderation</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and moderate user ratings and feedback across all EV charging stations
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center space-x-2">
          {['all', 'published', 'pending', 'hidden', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                filterStatus === status
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
            <span>Loading reviews...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No reviews found</p>
            <p className="text-xs text-slate-400">There are no reviews matching the selected filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredReviews.map((rev) => (
              <div key={rev._id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center space-x-1">
                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      <span className="font-extrabold text-sm">{rev.rating}.0</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {rev.stationId?.name || 'Charging Station'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        By <span className="font-semibold text-slate-700 dark:text-slate-300">{rev.userId?.name || 'Driver'}</span> ({rev.userId?.email})
                        • {new Date(rev.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border capitalize ${getStatusBadge(rev.status)}`}>
                      {rev.status}
                    </span>

                    <div className="flex items-center space-x-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                      {rev.status !== 'published' && (
                        <button
                          onClick={() => handleUpdateStatus(rev._id, 'published')}
                          title="Publish Review"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {rev.status !== 'hidden' && (
                        <button
                          onClick={() => handleUpdateStatus(rev._id, 'hidden')}
                          title="Hide Review"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {rev.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(rev._id, 'rejected')}
                          title="Reject Review"
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(rev._id)}
                        title="Delete Permanently"
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub ratings */}
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    Speed: <strong>{rev.chargingSpeedRating || rev.rating}/5</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    Availability: <strong>{rev.availabilityRating || rev.rating}/5</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    Cleanliness: <strong>{rev.cleanlinessRating || rev.rating}/5</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    Staff: <strong>{rev.staffRating || rev.rating}/5</strong>
                  </span>
                </div>

                {rev.comment && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageReviews;
