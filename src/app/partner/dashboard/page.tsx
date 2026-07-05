"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, CheckCircle, PlayCircle } from "lucide-react";
import OrderNotification from "@/components/OrderNotification";

// Keeping all the interfaces unchanged
interface Service {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  isActive: boolean;
}

interface PartnerData {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    approved: boolean;
    isActive: boolean;
    lastActive: string;
  };
  services: Service[];
  serviceAreas: {
    id: string;
    pincode: string;
    addedAt: string;
  }[];
  meta: {
    totalServices: number;
    totalServiceAreas: number;
    pendingRequests: number;
    timestamp: string;
  };
}

interface Order {
  id: string;
  service: {
    name: string;
    category: string;
  };
  user: {
    name: string;
    email: string;
    phoneno?: string;
  };
  date: string;
  time: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "SERVICE_COMPLETED"
    | "PAYMENT_REQUESTED"
    | "PAYMENT_COMPLETED"
    | "COMPLETED"
    | "CANCELLED";
  amount: number;
  walletAmount?: number;
  razorpayPaymentId?: string;
  startedAt?: string;
  paidAt?: string;
  paymentMode: "ONLINE" | "COD";
}

export default function PartnerDashboard() {
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [acceptedOrders, setAcceptedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [error, setError] = useState<string | null>(null);

  // Keeping all the fetch functions and handlers unchanged
  const fetchPartnerData = async () => {
    try {
      const response = await fetch("/api/partner");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setPartnerData(data.data);
      } else {
        throw new Error(data.error || "Failed to fetch partner data");
      }
    } catch (err) {
      console.error("Error fetching partner data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch partner data"
      );
    }
  };

  const fetchAcceptedOrders = async () => {
    try {
      const response = await fetch("/api/partner/orders");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setAcceptedOrders(data.data.orders);
      } else {
        throw new Error(data.error || "Failed to fetch orders");
      }
    } catch (err) {
      console.error("Error fetching accepted orders:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchPartnerData(), fetchAcceptedOrders()]);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchAcceptedOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const getOrderStatusDisplay = (order: Order) => {
    switch (order.status) {
      case "ACCEPTED":
        return {
          text: order.razorpayPaymentId ? "Accepted (Prepaid)" : "Accepted",
          className: "bg-yellow-100 text-yellow-800",
        };
      case "IN_PROGRESS":
        return {
          text: order.razorpayPaymentId
            ? "In Progress (Prepaid)"
            : "In Progress",
          className: "bg-blue-100 text-blue-800",
        };
      case "SERVICE_COMPLETED":
        return {
          text: "Service Completed (Awaiting Payment)",
          className: "bg-yellow-100 text-yellow-800",
        };
      case "COMPLETED":
        return {
          text: "Order Completed",
          className: "bg-green-100 text-green-800",
        };
      case "PAYMENT_COMPLETED":
        return {
          text: order.paymentMode === "COD" 
            ? "Paid by Cash" 
            : "Payment Completed",
          className: "bg-green-100 text-green-800",
        };
      default:
        return {
          text: order.status,
          className: "bg-gray-100 text-gray-800",
        };
    }
  };

  // const getPaymentStatusMessage = (order: Order) => {
  //   if (!order) return null;

  //   if (order.walletAmount && order.walletAmount === order.amount) {
  //     return {
  //       text: "Payment received from wallet",
  //       className: "bg-blue-50",
  //       textColor: "text-blue-800",
  //     };
  //   }
  //   if (order.razorpayPaymentId) {
  //     return {
  //       text: "Payment received in advance",
  //       className: "bg-blue-50",
  //       textColor: "text-blue-800",
  //     };
  //   }
  //   return null;
  // };

  const handleStatusUpdate = async (
    orderId: string,
    newStatus: "IN_PROGRESS" | "SERVICE_COMPLETED"
  ) => {
    if (
      !confirm(
        `Are you sure you want to mark this service as ${newStatus.toLowerCase()}?`
      )
    ) {
      return;
    }

    setIsUpdatingStatus((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await fetch("/api/partner/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchAcceptedOrders();
      } else {
        throw new Error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdatingStatus((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const formatDateTime = (date: string, time: string) => {
    try {
      const formattedDate = new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const [hours, minutes] = time.split(":");
      const timeDate = new Date();
      timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      const formattedTime = timeDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return { formattedDate, formattedTime };
    } catch (err) {
      console.error("Error formatting date/time:", err);
      return { formattedDate: date, formattedTime: time };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!partnerData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-red-600">Failed to load partner data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Partner Dashboard</h1>
          <div className="flex space-x-4">
            <Link
              href="/partner/dashboard/request-new-service"
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Request New Service
            </Link>
          </div>
        </div>

        {/* Top Section: Services and Accepted Orders side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Active Services */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">
              Your Services
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {partnerData.services.length === 0 ? (
                <p className="text-gray-500">No services added yet</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {partnerData.services.map((service) => (
                    <li key={service.id} className="py-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-black">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            ₹{service.price.toFixed(2)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            service.isActive
                              ? "bg-gray-100 text-gray-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Accepted Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">
              Accepted Orders
            </h2>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {acceptedOrders.length === 0 ? (
                <p className="text-gray-500">No accepted orders</p>
              ) : (
                acceptedOrders.map((order) => {
                  const { formattedDate, formattedTime } = formatDateTime(
                    order.date,
                    order.time
                  );
                  const status = getOrderStatusDisplay(order);
                  const isUpdating = isUpdatingStatus[order.id] || false;
                  const isAdvancePayment =
                    order.razorpayPaymentId ||
                    (order.walletAmount && order.walletAmount === order.amount);

                  return (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-black">
                            {order.service.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Customer: {order.user.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Date: {formattedDate}
                          </p>
                          <p className="text-sm text-gray-600">
                            Time: {formattedTime}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${status.className}`}
                        >
                          {status.text}
                        </span>
                        {isAdvancePayment && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Payment Done in Advance
                          </span>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium text-black">
                            Amount: ₹{order.amount.toFixed(2)}
                          </p>
                          {order.paidAt && (
                            <p className="text-xs text-gray-500">
                              Paid on:{" "}
                              {new Date(order.paidAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>

                        {/* Service Status Update Button */}
                        <div className="mt-3">
                          {/* Single button based on status */}
                          {(order.status === "ACCEPTED" ||
                            (order.status === "PAYMENT_COMPLETED" &&
                              !order.startedAt)) && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(order.id, "IN_PROGRESS")
                              }
                              disabled={isUpdating}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                            >
                              {isUpdating ? (
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <PlayCircle className="w-4 h-4 mr-2" />
                              )}
                              Start Service
                            </button>
                          )}

                          {order.status === "IN_PROGRESS" && (
                            <button
                              onClick={() =>
                                handleStatusUpdate(
                                  order.id,
                                  "SERVICE_COMPLETED"
                                )
                              }
                              disabled={isUpdating}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
                            >
                              {isUpdating ? (
                                <Clock className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Complete Service
                            </button>
                          )}

                          {/* Service Completed Status */}
                          {order.status === "SERVICE_COMPLETED" && (
                            <div className="p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                {isAdvancePayment
                                  ? "Service completed (Payment received in advance)"
                                  : "Waiting for customer payment"}
                              </p>
                              {order.paidAt && (
                                <p className="text-xs text-yellow-700 mt-1">
                                  Paid on:{" "}
                                  {new Date(order.paidAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Payment Completed Status */}
                          {order.status === "PAYMENT_COMPLETED" &&
                            order.startedAt && (
                              <div className="p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-800">
                                  {order.walletAmount === order.amount
                                    ? "Payment received from wallet"
                                    : order.paymentMode === "COD"
                                    ? "Payment received by cash"
                                    : "Payment received online"}
                                </p>
                                {order.paidAt && (
                                  <p className="text-xs text-green-700 mt-1">
                                    Paid on:{" "}
                                    {new Date(
                                      order.paidAt
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: New Order Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-black">
              New Order Requests
            </h2>
            {partnerData?.meta?.pendingRequests !== undefined && (
              <span className="text-sm text-gray-500">
                {partnerData.meta.pendingRequests} pending
              </span>
            )}
          </div>
          <OrderNotification />
        </div>
      </div>
    </div>
  );
}
