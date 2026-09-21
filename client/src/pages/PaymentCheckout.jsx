import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getInvoiceForSession } from '../services/invoiceService';
import { createPayment, verifyMockPayment, createStripeCheckout } from '../services/paymentService';
import InvoiceSummary from '../components/payment/InvoiceSummary';
import PaymentMethodSelector from '../components/payment/PaymentMethodSelector';
import MockPaymentPanel from '../components/payment/MockPaymentPanel';
import PaymentFailureMessage from '../components/payment/PaymentFailureMessage';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const PaymentCheckout = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [invoiceData, setInvoiceData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('mock_upi');
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [failureState, setFailureState] = useState(null);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await getInvoiceForSession(sessionId);
      setInvoiceData(res.data);

      // If already paid, can navigate to receipt
      if (res.data?.session?.paymentStatus === 'paid' && res.data?.existingPayment?._id) {
        navigate(`/payments/${res.data.existingPayment._id}/receipt`);
        return;
      }

      if (res.data?.existingPayment) {
        setPaymentRecord(res.data.existingPayment);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate invoice for session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchInvoice();
    }
  }, [sessionId]);

  // Handle Mock Payment Success
  const handleSimulateSuccess = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setFailureState(null);

      // Step 1: Ensure Payment document exists
      let pId = paymentRecord?._id;
      if (!pId) {
        const createRes = await createPayment({
          sessionId,
          paymentMethod: selectedMethod,
          provider: 'mock',
        });
        pId = createRes.data._id;
        setPaymentRecord(createRes.data);
      }

      // Step 2: Verify Mock Payment
      const verifyRes = await verifyMockPayment(pId, {
        action: 'success',
        paymentMethod: selectedMethod,
      });

      // Step 3: Redirect to payment result screen
      navigate(`/payments/result/${pId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment simulation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Mock Payment Failure
  const handleSimulateFailure = async (reason) => {
    try {
      setIsProcessing(true);
      setError('');

      let pId = paymentRecord?._id;
      if (!pId) {
        const createRes = await createPayment({
          sessionId,
          paymentMethod: selectedMethod,
          provider: 'mock',
        });
        pId = createRes.data._id;
        setPaymentRecord(createRes.data);
      }

      const verifyRes = await verifyMockPayment(pId, {
        action: 'failure',
        failureReason: reason,
        paymentMethod: selectedMethod,
      });

      setFailureState(verifyRes.message || reason);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failure trigger error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cancel
  const handleCancel = () => {
    navigate(`/sessions/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        to={`/sessions/${sessionId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Charging Session
      </Link>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {failureState ? (
        <PaymentFailureMessage
          failureReason={failureState}
          sessionId={sessionId}
          onRetry={() => {
            setFailureState(null);
            fetchInvoice();
          }}
        />
      ) : (
        <>
          {/* Invoice Summary Card */}
          <InvoiceSummary invoiceData={invoiceData} />

          {/* Payment Method Selector */}
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
            provider="mock"
          />

          {/* Mock Gateway Checkout Panel */}
          <MockPaymentPanel
            totalAmount={invoiceData?.billing?.totalAmount || 0}
            currencySymbol={invoiceData?.billing?.currencySymbol || '₹'}
            isProcessing={isProcessing}
            onSimulateSuccess={handleSimulateSuccess}
            onSimulateFailure={handleSimulateFailure}
            onCancel={handleCancel}
          />
        </>
      )}
    </div>
  );
};

export default PaymentCheckout;
