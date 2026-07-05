'use client'
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

interface Partner {
    id: string;
    name: string;
    email: string;
    phoneno: string | null;
    createdAt: string;
    lastActiveAt: string;
    isActive: boolean;
    approved: boolean;
    services: string[];  // Changed from service to services
    pincodes: string[];  // Changed from PartnerPincode array to string array
    activeOrdersCount: number;
    recentOrders: {
      id: string;
      status: string;
      createdAt: string;
    }[];
  }

interface PendingPartner {
  id: string;
  name: string;
  email: string;
}

function ProvidersList() {
  const [pendingPartners, setPendingPartners] = useState<PendingPartner[]>([]);
  const [approvedPartners, setApprovedPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingPartners = async () => {
    try {
      const response = await fetch('/api/admin/pending-partners');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPendingPartners(data.partners || []);
    } catch (error) {
      console.error('Error fetching pending partners:', error);
      toast.error('Failed to fetch pending partners');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      SERVICE_COMPLETED: 'bg-green-100 text-green-800',
      PAYMENT_REQUESTED: 'bg-orange-100 text-orange-800',
      PAYMENT_COMPLETED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const fetchApprovedPartners = async () => {
    try {
      const response = await fetch('/api/admin/approved-partners');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Approved partners data:', data); // Add this debug line
      setApprovedPartners(data.partners || []);
    } catch (error) {
      console.error('Error fetching approved partners:', error);
      toast.error('Failed to fetch approved partners');
    }
  };

  const handleApproval = async (partnerId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/admin/approve-partner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, approved }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update partner status');
      }

      toast.success(approved ? 'Partner approved successfully' : 'Partner rejected successfully');
      
      // First fetch pending partners to remove the approved one
      await fetchPendingPartners();
      
      // Add a small delay before fetching approved partners
      setTimeout(async () => {
        await fetchApprovedPartners();
      }, 1000);

    } catch (error) {
      console.error('Error in handleApproval:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update partner status');
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchPendingPartners(), fetchApprovedPartners()]);
      } catch (error) {
        console.error('Error in initial data fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up polling every 5 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);


  const handleDelete = async (partnerId: string) => {
    if (!confirm('Are you sure you want to delete this partner?')) return;

    try {
      const response = await fetch(`/api/admin/delete-partner/${partnerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete partner');
      }

      toast.success('Partner deleted successfully');
      await fetchApprovedPartners();
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete partner');
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Pending Approvals</h2>
        {pendingPartners.length === 0 ? (
          <p className="text-gray-500">No pending approvals</p>
        ) : (
          <div className="space-y-4">
            {pendingPartners.map((partner) => (
              <div key={partner.id} className="border p-4 rounded-lg flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{partner.name}</h3>
                  <p className="text-gray-600">{partner.email}</p>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleApproval(partner.id, true)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(partner.id, false)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Partners Section */}
      {/* Approved Partners Section */}
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-2xl font-bold mb-4">Approved Partners</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {approvedPartners.map((partner) => (
      <div key={partner.id} className="border p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{partner.name}</h3>
            <p className="text-gray-600">{partner.email}</p>
            {partner.phoneno && (
              <p className="text-gray-600">Phone: {partner.phoneno}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${
              partner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {partner.isActive ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={() => handleDelete(partner.id)}
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium">Services:</p>
          <p className="text-gray-600">
            {partner.services?.length > 0 ? partner.services.join(', ') : 'No services'}
          </p>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium">Pincodes:</p>
          <p className="text-gray-600">
            {partner.pincodes?.length > 0 ? partner.pincodes.join(', ') : 'No pincodes'}
          </p>
        </div>
        {partner.activeOrdersCount > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium">Active Orders: {partner.activeOrdersCount}</p>
            <div className="mt-1 space-y-1">
              {partner.recentOrders.map(order => (
                <div key={order.id} className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusColor(order.status)
                  }`}>
                    {order.status}
                  </span>
                  <span className="ml-2 text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
</div>
    </div>
  );
}

// Disable SSR for this component
const ProvidersPage = dynamic(() => Promise.resolve(ProvidersList), {
  ssr: false,
});

export default ProvidersPage;