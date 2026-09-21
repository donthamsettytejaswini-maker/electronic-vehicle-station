import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPaymentReceipt } from '../services/invoiceService';
import ReceiptCard from '../components/payment/ReceiptCard';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

const Receipt = () => {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const res = await getPaymentReceipt(id);
        setReceipt(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load receipt.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReceipt();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-600">Receipt record not found.</p>
        <Link to="/payments" className="text-emerald-600 font-bold hover:underline mt-2 inline-block">
          View Payment History
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/payments"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition print:hidden"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Payment History
      </Link>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <ReceiptCard receipt={receipt} />
    </div>
  );
};

export default Receipt;
