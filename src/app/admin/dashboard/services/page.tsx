'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useEdgeStore } from '@/lib/edgestore';
import ServiceModal from '@/components/ServiceModal';
import Image from 'next/image';

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    threshold: number;
    isActive: boolean;
    image?: string;
    ServiceProvider: Array<{
        Partner: {
            name: string;
            email: string;
        }
    }>;
}

interface ServiceFormData {
    name: string;
    description: string;
    price: number;
    category: string;
    threshold: number;
    image?: string;
}

export default function ServicesPage() {
    const { edgestore } = useEdgeStore();
    const [services, setServices] = useState<Service[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await fetch('/api/admin/services');
            const data = await response.json();
            setServices(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching services:', error);
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, imageUrl?: string) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

        setDeletingId(id);

        try {
            // First delete the image if it exists
            if (imageUrl) {
                const imageRes = await fetch('/api/edgestore/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: imageUrl }),
                });

                if (!imageRes.ok) {
                    throw new Error('Failed to delete image');
                }
                console.log('Image deleted successfully');
            }

            // Then delete the service
            const response = await fetch('/api/admin/services', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                setServices(services.filter(service => service.id !== id));
            } else {
                alert('Failed to delete service');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('An error occurred while deleting the service');
        } finally {
            setDeletingId(null);
        }
    };

    const handleEdit = (service: Service) => {
        setSelectedService(service);
        setIsEditModalOpen(true);
    };

    const handleAddSubmit = async (formData: ServiceFormData, file?: File) => {
        setIsUploading(true);
        let imageUrl = '';
        try {
            if (file) {
                const res = await edgestore.publicFiles.upload({
                    file,
                    options: {
                        temporary: true,
                    }
                });
                imageUrl = res.url;
            }

            const response = await fetch('/api/admin/services', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...formData, image: imageUrl }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error || 'Failed to create service');
            }

            const newService = await response.json();
            if (file && imageUrl) {
                // Make the upload permanent after successful service creation
                await edgestore.publicFiles.confirmUpload({
                    url: imageUrl,
                });
            }
            setServices([...services, newService]);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error('Error adding service:', error);
            // Cleanup temporary upload if it exists
            if (imageUrl) {
                await edgestore.publicFiles.delete({
                    url: imageUrl,
                });
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditSubmit = async (formData: ServiceFormData, file?: File) => {
        if (!selectedService) return;
        setIsUploading(true);
      
        try {
          let imageUrl = selectedService.image;
          
          if (file) {
            // Upload new image
            const res = await edgestore.publicFiles.upload({
              file,
              options: {
                temporary: true,
              }
            });
            imageUrl = res.url;
          }
      
          const response = await fetch('/api/admin/services', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: selectedService.id, ...formData, image: imageUrl }),
        });        
      
          if (response.ok) {
            if (file && imageUrl) {
              // Make the new upload permanent
              await edgestore.publicFiles.confirmUpload({
                url: imageUrl,
              });
              
              // Delete old image if it exists through the API endpoint instead of direct EdgeStore deletion
              if (selectedService.image) {
                const deleteRes = await fetch('/api/edgestore/delete', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: selectedService.image }),
                });
      
                if (!deleteRes.ok) {
                  console.error('Failed to delete old image');
                }
              }
            }
            
            const updatedService = await response.json();
            setServices(services.map(service => 
              service.id === selectedService.id ? updatedService : service
            ));
            setIsEditModalOpen(false);
            setSelectedService(null);
          }
        } catch (error) {
          console.error('Error updating service:', error);
          alert('Failed to update service');
        } finally {
          setIsUploading(false);
        }
      };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Services</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-black text-white rounded-md flex items-center gap-2 hover:bg-gray-800"
                >
                    <Plus size={20} />
                    Add New Service
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <div key={service.id} className="bg-white p-6 rounded-lg shadow">
                            {service.image && (
                                <div className="mb-4 relative aspect-video">
                                    <Image
                                        src={service.image}
                                        alt={service.name}
                                        className="w-full h-full object-cover rounded-md"
                                        width={700}
                                        height={500}
                                    />
                                </div>
                            )}
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold">{service.name}</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(service)}
                                        className="p-2 text-gray-600 hover:text-black"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id, service.image)}
                                        className="p-2 text-gray-600 hover:text-red-600 disabled:opacity-50"
                                        disabled={deletingId === service.id}
                                    >
                                        <Trash2 size={18} />
                                        {deletingId === service.id && (
                                            <span className="ml-2">Deleting...</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 text-gray-600">
                                <p><span className="font-medium">Category:</span> {service.category.replace(/_/g, ' ')}</p>
                                <p><span className="font-medium">Price:</span> ₹{service.price}</p>
                                <p><span className="font-medium">Threshold Hours:</span> {service.threshold}</p>
                                <p className="line-clamp-2"><span className="font-medium">Description:</span> {service.description}</p>
                                <div>
                                    <p className="font-medium mb-1">Service Providers:</p>
                                    <ul className="list-disc list-inside">
                                        {service.ServiceProvider.map((sp, index) => (
                                            <li key={index} className="text-sm">
                                                {sp.Partner.name} ({sp.Partner.email})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Service Modal */}
            <ServiceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddSubmit}
                mode="add"
                isUploading={isUploading}
            />

            {/* Edit Service Modal */}
            {selectedService && (
                <ServiceModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedService(null);
                    }}
                    onSubmit={handleEditSubmit}
                    initialData={{
                        name: selectedService.name,
                        description: selectedService.description,
                        price: selectedService.price,
                        category: selectedService.category,
                        threshold: selectedService.threshold,
                        image: selectedService.image,
                    }}
                    mode="edit"
                    isUploading={isUploading}
                />
            )}
        </div>
    );
}