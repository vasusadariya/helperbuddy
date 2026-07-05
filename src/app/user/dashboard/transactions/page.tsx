"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

type TransactionType = "CREDIT" | "DEBIT" | "REFERRAL_BONUS" | "SIGNUP_BONUS";
type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  createdAt: string;
  orderId?: string | null;
  status: TransactionStatus;
  Order?: {
    id: string;
    status: string;
    service: {
      name: string;
    };
  };
}

interface TransactionsResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    timestamp: string;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchTransactions = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/transactions?page=${page}&limit=20`);
      const data: TransactionsResponse = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      if (data.success) {
        if (page === 1) {
          setTransactions(data.data.transactions);
        } else {
          setTransactions(prev => [...prev, ...data.data.transactions]);
        }
        setHasMore(data.data.transactions.length === 20);
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const formatTransactionType = (type: TransactionType): string => {
    if (!type) return '';
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatTransactionStatus = (status: TransactionStatus): string => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const isCredit = (type: TransactionType): boolean => {
    return ["CREDIT", "REFERRAL_BONUS", "SIGNUP_BONUS"].includes(type);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            href="/user/dashboard"
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Transaction History</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {isLoading && transactions.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-600">
            {error}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-2 rounded-full ${
                        isCredit(transaction.type)
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {isCredit(transaction.type) ? (
                        <ArrowDownRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description || 'Transaction'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(transaction.createdAt)}
                      </p>
                      {transaction.Order && (
                        <p className="text-xs text-gray-500">
                          {transaction.Order.service.name} - Order #{transaction.Order.id}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        isCredit(transaction.type)
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {isCredit(transaction.type) ? "+" : "-"}
                      ₹{Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTransactionType(transaction.type)}
                    </p>
                    <p 
                      className={`text-xs ${
                        transaction.status === 'COMPLETED' 
                          ? 'text-green-600' 
                          : transaction.status === 'FAILED'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {formatTransactionStatus(transaction.status)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !isLoading && !error && (
          <div className="p-4 text-center">
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}