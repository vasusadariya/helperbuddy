"use client";

import { useState, useEffect } from "react";
import { Category } from "@prisma/client";

interface PartnerProfile {
  id: string;
  name: string;
  email: string;
  phoneno: string | null;
  service: string[];
  approved: boolean;
  isActive: boolean;
  lastActiveAt: string;
  pincodes: {
    id: string;
    pincode: string;
  }[];
}

interface Service {
  id: string;
  name: string;
  category: Category;
  price: number;
  isActive: boolean;
}

export default function PartnerProfilePage() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showPincodeDialog, setShowPincodeDialog] = useState(false);

  // Form states
  const [phone, setPhone] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchServices();
  }, []);

  // API calls remain the same
  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/partner/profile");
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        // Initialize phone state with current phone number
        setPhone(data.data.phoneno || "");
      } else {
        throw new Error(data.error || "Failed to fetch profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/partner/dashboard/services");
      const data = await response.json();
      
      if (data.success) {
        setServices(data.data);
      }
    } catch (err) {
      console.error("Error fetching services:", err);
    }
  };

  const handleUpdateProfile = async () => {
    // Only make API call if phone number has changed
    if (phone === profile?.phoneno) {
      setIsEditing(false);
      return;
    }

    setUpdateLoading(true);
    try {
      const response = await fetch("/api/partner/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneno: phone }),
      });

      const data = await response.json();
      
      if (data.success) {
        setProfile(prev => prev ? { ...prev, phoneno: phone } : null);
        setIsEditing(false);
      } else {
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setUpdateLoading(false);
    }
  };


  const handleAddService = async () => {
    if (!selectedService) {
      setError("Please select a service before adding");
      return;
    }
    try {
      const response = await fetch("/api/partner/services/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: selectedService }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchProfile();
        setShowServiceDialog(false);
      } else {
        throw new Error(data.error || "Failed to add service");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add service");
    }
  };

  const handleAddPincode = async () => {
    try {
      const response = await fetch("/api/partner/pincodes/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: newPincode }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchProfile();
        setShowPincodeDialog(false);
        setNewPincode("");
      } else {
        throw new Error(data.error || "Failed to add pincode");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add pincode");
    }
  };

  const handleRemovePincode = async (pincodeId: string) => {
    try {
      const response = await fetch(`/api/partner/pincodes/${pincodeId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchProfile();
      } else {
        throw new Error(data.error || "Failed to remove pincode");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove pincode");
    }
  };
  const handleCancelEdit = () => {
    setPhone(profile?.phoneno || "");
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Failed to load profile data</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
          <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Partner Profile</h1>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1">{profile.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1">{profile?.email}</p>
                {isEditing && (
                  <p className="mt-1 text-sm text-gray-500 italic">
                    Email address cannot be changed
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      maxLength={10}
                      placeholder="Enter new phone number (optional)"
                    />
                    <p className="text-sm text-gray-500">
                      Current: {profile.phoneno || "Not provided"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1">{profile.phoneno || "Not provided"}</p>
                )}
              </div>

              {isEditing && (
                <div className="flex space-x-4">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={updateLoading}
                    className={`px-4 py-2 text-white rounded-md transition-colors ${
                      phone === profile.phoneno
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {updateLoading ? "Updating..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
                {error && (
                <div className="text-red-600 text-sm mt-2">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Services Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Services</h2>
              <button
                onClick={() => setShowServiceDialog(true)}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Add Service
              </button>
            </div>
            <div className="space-y-2">
              {profile.service.map((service) => (
                <div key={service} className="p-3 bg-gray-50 rounded-lg">
                  {service}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service Areas Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Service Areas</h2>
              <button
                onClick={() => setShowPincodeDialog(true)}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Add Pincode
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profile.pincodes.map((pincode) => (
                <div key={pincode.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span>{pincode.pincode}</span>
                  <button
                    onClick={() => handleRemovePincode(pincode.id)}
                    className="text-red-600 hover:text-red-800 px-2 py-1 rounded-md"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Service Modal */}
      {showServiceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-[20vh]">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-bold mb-4">Add New Service</h3>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md mb-4 [&>*]:bg-white"
            style={{ transformOrigin: 'top' }}
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowServiceDialog(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddService}
              disabled={!selectedService}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Add Pincode Modal */}
      {showPincodeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Add New Pincode</h3>
            <input
              type="text"
              placeholder="Enter pincode"
              value={newPincode}
              onChange={(e) => setNewPincode(e.target.value)}
              maxLength={6}
              className="w-full p-2 border border-gray-300 rounded-md mb-4"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowPincodeDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPincode}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}