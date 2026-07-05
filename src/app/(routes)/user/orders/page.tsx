// app/(routes)/user/orders/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  useEffect(() => {
    if (status === 'payment_success') {
      const redirectTimer = setTimeout(() => {
        router.push('/user/dashboard');
      }, 5000); // 7 seconds delay

      return () => clearTimeout(redirectTimer);
    }

    router.push('/user/dashboard');
  }, [router, status]);

  if (status === 'payment_success') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-black mb-4">
            You will be redirected to the dashboard in a few seconds...
          </h2>
          <p className="text-gray-600">
            If you are not redirected automatically,{' '}
            <button 
              onClick={() => router.push('/user/dashboard')}
              className="text-black underline hover:text-gray-800"
            >
              click here
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Redirect immediately if no success status (handled in the effect above)
  return null;
}