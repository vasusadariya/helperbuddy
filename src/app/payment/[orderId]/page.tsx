'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Script from 'next/script';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface OrderDetails {
  orderId: string;
  totalAmount: number;
  walletBalance: number;
  walletAmount: number;
  remainingAmount: number;
  razorpayOrderId: string;
  razorpayAmount: number;
  status: string;
  razorpayKeyId: string;
  serviceDetails: {
    name: string;
    description: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
      Razorpay: {
        new (options: RazorpayOptions): {
          open: () => void;
          on: (event: string, callback: (response: { error: { code: string; description: string; source: string; step: string; reason: string; metadata: { order_id: string; payment_id: string; } } }) => void) => void;
        };
      };
        }
  
    interface RazorpayOptions {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      handler: (response: RazorpayResponse) => void;
      modal?: {
        ondismiss?: () => void;
      };
      prefill?: {
        email?: string;
        contact?: string;
      };
      notes?: {
        orderId?: string;
      };
      theme?: {
        color?: string;
      };
  }
}

export default function PaymentPage() {
  const router = useRouter();
  const { orderId } = useParams() as { orderId: string }; // Unwrap params using useParams
  const { data: session, status: sessionStatus } = useSession();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/signin');
      return;
    }
  
    if (sessionStatus === 'authenticated' && orderId) {
      const fetchOrderDetails = async (id: string) => {
        try {
          setLoading(true);
          setError(null);
  
          const response = await fetch(`/api/payment/initiate/${id}`);
          const data = await response.json();
  
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to fetch order details');
          }
  
          if (data.data.status === 'COMPLETED') {
            router.push('/user/orders?status=success');
            return;
          }
  
          setOrderDetails(data.data);
        } catch (err) {
          console.error('Error fetching order details:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
          setLoading(false);
        }
      };
  
      fetchOrderDetails(orderId);
    }
  }, [sessionStatus, orderId, router]);

  const fetchOrderDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/payment/initiate/${id}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch order details');
      }

      if (data.data.status === 'COMPLETED') {
        router.push('/user/orders?status=success');
        return;
      }

      setOrderDetails(data.data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: RazorpayResponse) => {
    try {
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: orderDetails?.orderId,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        router.push('/user/orders?status=payment_success');
      } else {
        throw new Error(verifyData.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError('Payment verification failed. Please contact support.');
      router.push('/user/orders?status=payment_failed');
    }
  };

  const initializeRazorpay = () => {
    if (!orderDetails?.razorpayOrderId) {
      setError('Invalid payment configuration');
      return;
    }

    setProcessingPayment(true);

    const options = {
      key: orderDetails.razorpayKeyId,
      amount: orderDetails.razorpayAmount,
      currency: "INR",
      name: "Helper Buddy",
      description: `Payment for ${orderDetails.serviceDetails.name}`,
      order_id: orderDetails.razorpayOrderId,
      handler: function (response: RazorpayResponse) {
        handlePaymentSuccess(response);
      },
      modal: {
        ondismiss: function() {
          setProcessingPayment(false);
          console.log('Payment modal dismissed');
        }
      },
      prefill: {
        email: session?.user?.email || '',
        contact: '',
      },
      notes: {
        orderId: orderDetails.orderId
      },
      theme: {
        color: "#2563EB",
      },
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: { error: { code: string; description: string; source: string; step: string; reason: string; metadata: { order_id: string; payment_id: string; } } }) {
        console.error('Payment failed:', response.error);
        setError('Payment failed. Please try again.');
        setProcessingPayment(false);
        router.push('/user/orders?status=payment_failed');
      });
      rzp.open();
    } catch (err) {
      console.error('Razorpay initialization error:', err);
      setError('Failed to initialize payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg max-w-md w-full mx-4">
          <div className="flex items-center space-x-3 text-red-800">
            <AlertCircle className="h-6 w-6" />
            <h3 className="font-medium">Error</h3>
          </div>
          <p className="text-red-600 mt-2">{error}</p>
          <div className="mt-4 flex space-x-3">
            <button 
              onClick={() => fetchOrderDetails(orderId)}
              className="text-blue-600 hover:text-blue-800"
            >
              Try Again
            </button>
            <Link
              href="/user/orders"
              className="text-gray-600 hover:text-gray-800"
            >
              View Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/user/orders"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Payment Details
              </h2>

              {orderDetails && (
                <div className="space-y-6">
                  <div className="border-b pb-6">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {orderDetails.serviceDetails.name}
                    </h3>
                    <p className="text-gray-600">
                      {orderDetails.serviceDetails.description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount</span>
                      <span className="font-medium">
                        {formatCurrency(orderDetails.totalAmount)}
                      </span>
                    </div>

                    {orderDetails.walletBalance > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Available Wallet Balance</span>
                        <span>{formatCurrency(orderDetails.walletBalance)}</span>
                      </div>
                    )}

                    {orderDetails.walletAmount > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Wallet Amount Used</span>
                        <span>{formatCurrency(orderDetails.walletAmount)}</span>
                      </div>
                    )}

                    {orderDetails.remainingAmount > 0 && (
                      <div className="flex justify-between text-lg font-bold border-t pt-4">
                        <span>Amount to Pay</span>
                        <span>{formatCurrency(orderDetails.remainingAmount)}</span>
                      </div>
                    )}
                  </div>

                  {orderDetails.remainingAmount > 0 ? (
                    <button
                      onClick={initializeRazorpay}
                      disabled={processingPayment}
                      className={`w-full ${
                        processingPayment 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white py-3 px-4 rounded-lg transition-colors duration-200`}
                    >
                      {processingPayment ? 'Processing Payment...' : 'Pay Now'}
                    </button>
                  ) : (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 font-medium">
                        Order placed successfully!
                      </p>
                      <button 
                        onClick={() => router.push('/user/orders')}
                        className="mt-4 text-blue-600 hover:text-blue-800"
                      >
                        View Your Orders
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}