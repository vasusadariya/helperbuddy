'use client'
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEdgeStore } from '@/lib/edgestore';
import { Check, X } from 'lucide-react';
import ServiceModal from '@/components/ServiceModal';

interface RequestedService {
    id: string;
    name: string;
}

interface PartnerRequestedService {
    id: string;
    name: string;
    description?: string;
    status: string;
    partnerId?: string;
}

interface ServiceFormData {
    name: string;
    description: string;
    price: number;
    category: string;
    threshold: number;
    image?: string;
}

export default function ServicesRecommendations() {
    const [userRequestedServices, setUserRequestedServices] = useState<RequestedService[]>([]);
    const [partnerRequestedServices, setPartnerRequestedServices] = useState<PartnerRequestedService[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [selectedServiceType, setSelectedServiceType] = useState<'user' | 'partner' | null>(null);

    const [loadingUserServices, setLoadingUserServices] = useState(true);
    const [loadingPartnerServices, setLoadingPartnerServices] = useState(true);

    const [errorUserServices, setErrorUserServices] = useState<string | null>(null);
    const [errorPartnerServices, setErrorPartnerServices] = useState<string | null>(null);
    const { edgestore } = useEdgeStore();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleAddSubmit = async (formData: ServiceFormData, file?: File) => {
        setIsUploading(true);
        try {
            let imageUrl = '';
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

            if (response.ok) {

                if (file && imageUrl) {
                    await edgestore.publicFiles.confirmUpload({
                        url: imageUrl,
                    });
                }

                // Remove the service based on selectedServiceId and selectedServiceType
                if (selectedServiceType === 'user') {
                    setUserRequestedServices(prev =>
                        prev.filter(service => service.id !== selectedServiceId)
                    );
                } else if (selectedServiceType === 'partner') {
                    setPartnerRequestedServices(prev =>
                        prev.filter(service => service.id !== selectedServiceId)
                    );
                }

                // Delete the service from the database
                if (selectedServiceId && selectedServiceType) {
                    await handleDelete(selectedServiceId, selectedServiceType);
                }

                setIsAddModalOpen(false);
                setSelectedServiceId(null);
                setSelectedServiceType(null);
            }
        } catch (error) {
            console.error('Error adding service:', error);

            if (formData.image) {
                await edgestore.publicFiles.delete({
                    url: formData.image,
                });
            }
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        fetch('/api/admin/services/requested-services')
            .then(response => response.json())
            .then(data => {
                setUserRequestedServices(data);
                setLoadingUserServices(false);
            })
            .catch(error => {
                setErrorUserServices(error.message);
                setLoadingUserServices(false);
            });

        fetch('/api/admin/services/partner-requested-services')
            .then(response => response.json())
            .then(data => {
                setPartnerRequestedServices(data);
                setLoadingPartnerServices(false);
            })
            .catch(error => {
                setErrorPartnerServices(error.message);
                setLoadingPartnerServices(false);
            });
    }, []);

    const handleApprove = async (id: string, type: 'user' | 'partner') => {
        setSelectedServiceId(id);
        setSelectedServiceType(type);

        const service = type === 'user'
            ? userRequestedServices.find(s => s.id === id)
            : partnerRequestedServices.find(s => s.id === id);

        if (service) {
            setIsAddModalOpen(true);
        }
    };

    const getInitialData = (): ServiceFormData | undefined => {
        if (!selectedServiceId || !selectedServiceType) return undefined;

        const service = selectedServiceType === 'user'
            ? userRequestedServices.find(s => s.id === selectedServiceId)
            : partnerRequestedServices.find(s => s.id === selectedServiceId);

        if (service) {
            return {
                name: service.name,
                description: selectedServiceType === 'partner'
                    ? (service as PartnerRequestedService).description || ''
                    : '',
                price: 0,
                category: '',
                threshold: 2,
                image: ''
            };
        }

        return undefined;
    };

    const handleDelete = async (id: string, type: 'user' | 'partner') => {
        const endpoint = type === 'user'
            ? `/api/admin/services/requested-services`
            : `/api/admin/services/partner-requested-services`; // No ID in URL
    
        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }), // ID is now sent in the body
            });
    
            if (!response.ok) {
                throw new Error(`Failed to delete service: ${response.statusText}`);
            }
    
            if (type === 'user') {
                setUserRequestedServices(prev => prev.filter(service => service.id !== id));
            } else {
                setPartnerRequestedServices(prev => prev.filter(service => service.id !== id));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            console.error(`[handleDelete] Error deleting ${type} service:`, errorMessage);
    
            if (type === 'user') {
                setErrorUserServices(errorMessage);
            } else {
                setErrorPartnerServices(errorMessage);
            }
        }
    };
    

    const ServicesList = ({
        title,
        services = [],
        loading,
        error,
        onDelete,
        type,
    }: {
        title: string;
        services?: RequestedService[] | PartnerRequestedService[]; // Make services optional
        loading: boolean;
        error: string | null;
        onDelete: (id: string) => void;
        type: 'user' | 'partner';
        showpartnerName?: boolean;
    }) => (
        <div className="flex-1 p-4 bg-white shadow-md rounded-md border border-gray-200">
            <h2 className="text-xl font-semibold mb-3">{title}</h2>

            {loading && (
                <div className="flex items-center justify-center h-20">
                    <p className="text-gray-500">Loading {title.toLowerCase()}...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-3">
                    <p>Error: {error}</p>
                </div>
            )}

            <div className="space-y-2">
                {services.length > 0 ? (
                    services.map(service => (
                        <Card key={service.id} className="border-zinc-200 bg-gray-50 hover:bg-gray-100 transition-all">
                            <CardHeader className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-semibold text-gray-800">
                                            {service.name}
                                        </CardTitle>
                                    </div>

                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => handleApprove(service.id, type)}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            onClick={() => onDelete(service.id)}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))
                ) : (
                    <div>
                        {loading ? (
                            <div>
                            </div>
                        ) : <p className="text-gray-500">No Services Requested</p>}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="mx-auto max-w-6xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ServicesList
                    title="Partner Requested Services"
                    services={partnerRequestedServices}
                    loading={loadingPartnerServices}
                    error={errorPartnerServices}
                    onDelete={(id) => handleDelete(id, 'partner')}
                    type="partner"
                    showpartnerName={true}
                />
                <ServicesList
                    title="User Requested Services"
                    services={userRequestedServices}
                    loading={loadingUserServices}
                    error={errorUserServices}
                    onDelete={(id) => handleDelete(id, 'user')}
                    type="user"
                />
            </div>
            <ServiceModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setSelectedServiceId(null);
                    setSelectedServiceType(null);
                }}
                onSubmit={handleAddSubmit}
                mode="add"
                isUploading={isUploading}
                initialData={getInitialData()}
            />
        </div>
    );
}