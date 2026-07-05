'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReviewProps {
  orderId: string;
  orderStatus: string;
  isPaid: boolean;
  isServiceCompleted: boolean;
  hasReview: boolean;
  onReviewSubmit?: () => void;
}

export function Review({ 
  orderId, 
  orderStatus, 
  isPaid, 
  isServiceCompleted,
  hasReview,
  onReviewSubmit 
}: ReviewProps) {
  const [rating, setRating] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Don't show review button if already reviewed or conditions not met
  if (hasReview || !isServiceCompleted || !isPaid || orderStatus !== 'COMPLETED') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          rating,
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      toast.success(
        <div className="flex flex-col">
          <span className="font-medium">Thanks for your feedback!</span>
          <span className="text-sm">Your review helps us improve our service.</span>
        </div>,
        {
          duration: 5000,
          position: 'top-center',
        }
      );

      setShowForm(false);
      if (onReviewSubmit) {
        onReviewSubmit();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
      >
        <Star className="w-4 h-4 mr-1.5" />
        Rate Service Provider
      </button>
    );
  }

  return (
    <div className="bg-yellow-50 p-4 rounded-lg mt-3">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rate your experience
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-1 rounded-full transition-colors ${
                  rating >= star 
                    ? 'text-yellow-400 hover:text-yellow-500' 
                    : 'text-gray-300 hover:text-gray-400'
                }`}
              >
                <Star className="w-6 h-6 fill-current" />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {rating === 5 ? "Excellent!" : 
               rating === 4 ? "Very Good!" :
               rating === 3 ? "Good" :
               rating === 2 ? "Fair" : "Poor"}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Share your experience (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
            rows={3}
            placeholder="How was your service experience?"
            maxLength={500}
          />
          {description && (
            <p className="mt-1 text-sm text-gray-500">
              {500 - description.length} characters remaining
            </p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}