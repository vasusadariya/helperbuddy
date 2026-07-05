// app/services/ServicesClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Category } from "@prisma/client";
import { toast } from "react-hot-toast";
import CheckoutModal from "@/components/CheckoutModal";
import { validateDateTime, validateDateTimeForServices } from "@/lib/utils/validation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Menu } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  threshold: number;
  numberoforders: number;
  category: Category;
  image?: string;
}

interface CartItem extends Service {
  quantity: number;
}

interface BookingDetails {
  date: string;
  time: string;
  address: string;
  phoneNo: string;
  pincode: string;
  remarks: string;
}

const categoryDisplayNames = {
  AC_SERVICE: "AC Service",
  BATHROOM_KITCHEN_CLEANING: "Bathroom & kitchen cleaning",
  CARPENTER: "Carpenter",
  CHIMNEY_REPAIR: "Chimney Repair",
  ELECTRICIAN: "Electrician",
  MICROWAVE_REPAIR: "Microwave Repair",
  PLUMBERS: "Plumbers",
  REFRIGERATOR_REPAIR: "Refrigerator Repair",
  SOFA_CARPET_CLEANING: "Sofa & Carpet Cleaning",
  WASHING_MACHINE_REPAIR: "Washing Machine Repair",
  WATER_PURIFIER_REPAIR: "Water Purifier Repair",
};

export default function ServicesClient({ 
  initialServices,
  initialQuery,
  initialCategory
}: { 
  initialServices: Service[];
  initialQuery: string;
  initialCategory: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [services, setServices] = useState<Service[]>(initialServices);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortType, setSortType] = useState('low-to-high');
  const [isClicked, setIsClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00",
    address: "",
    phoneNo: "",
    pincode: "",
    remarks: "",
  });

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSortOpen && !(event.target as Element).closest('.sort-container')) {
        setIsSortOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    updateURL({ query: value, category });
    
    try {
      const params = new URLSearchParams();
      if (value) params.append("query", value);
      if (category && category !== "all") params.append("category", category);
      
      const response = await fetch(`/api/services?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch services");
      
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search services");
    }
  };

  const handleSort = (type: string) => {
    setSortType(type);
    const sortedData = [...services];
  
    if (type === 'low-to-high') {
      sortedData.sort((a, b) => a.price - b.price);
    } else if (type === 'high-to-low') {
      sortedData.sort((a, b) => b.price - a.price);
    } else if (type === 'top-orders') {
      sortedData.sort((a, b) => b.numberoforders - a.numberoforders);
    }
  
    setServices(sortedData);
    setIsSortOpen(false);
  };

  const handleCategoryClick = async (selectedCategory: string) => {
    setCategory(selectedCategory);
    updateURL({ query, category: selectedCategory });
    
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (selectedCategory && selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }
      
      const response = await fetch(`/api/services?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch services");
      
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error("Category selection error:", error);
      toast.error("Failed to update services");
    } finally {
      setIsLoading(false);
    }
  };

  const updateURL = ({
    query,
    category,
  }: {
    query: string;
    category: string;
  }) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (category && category !== "all") params.set("category", category);
    router.replace(`/services?${params.toString()}`);
  };

  const handleRequestClick = async () => {
    try {
      await fetch("/api/services/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: query }),
      });
      setIsClicked(true);
      toast.success("Service request submitted successfully");
    } catch (error) {
      console.error("Error requesting service:", error);
      toast.error("Failed to submit service request");
    }
  };

  const addToCart = (service: Service) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === service.id);
      if (existingItem) {
        return currentCart.map((item) =>
          item.id === service.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...service, quantity: 1 }];
    });
    setIsCartOpen(true);
    toast.success("Added to cart");
  };

  const removeFromCart = (serviceId: string) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== serviceId)
    );
    toast.success("Removed from cart");
  };

  const updateQuantity = (serviceId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(serviceId);
      return;
    }
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === serviceId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast.success("Cart cleared");
  };

  const handleCheckout = async () => {
    if (!session) {
      toast.error("Please sign in to continue");
      router.push("/signin");
      return;
    }

    if (!bookingDetails.address.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }

    if (!bookingDetails.phoneNo.trim()) {
      toast.error("Please provide a phone number");
      return;
    }

    if (!bookingDetails.pincode.trim()) {
      toast.error("Please provide a pincode");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(bookingDetails.phoneNo)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    const pincodeRegex = /^[0-9]{6}$/;
    if (!pincodeRegex.test(bookingDetails.pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (cart.length === 1) {
      if (
        !validateDateTime(bookingDetails.date, bookingDetails.time, {
          threshold: cart[0].threshold,
          name: cart[0].name,
        })
      ) {
        return;
      }
    } else {
      const servicesWithThreshold = cart.map((service) => ({
        threshold: service.threshold,
        name: service.name,
      }));

      if (!validateDateTimeForServices(bookingDetails.date, bookingDetails.time, servicesWithThreshold)) {
        return;
      }
    }

    setIsProcessing(true);
    try {
      const bookingDate = new Date(
        `${bookingDetails.date}T${bookingDetails.time}`
      );

      const orderPromises = cart.map((item) =>
        fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceId: item.id,
            date: bookingDate.toISOString(),
            time: bookingDetails.time,
            address: bookingDetails.address,
            pincode: bookingDetails.pincode,
            remarks: bookingDetails.remarks,
            amount: item.price * item.quantity,
          }),
        })
      );

      const responses = await Promise.all(orderPromises);
      const results = await Promise.all(responses.map((r) => r.json()));

      const allSuccessful = results.every((result) => result.success);

      if (allSuccessful) {
        setIsCheckoutModalOpen(false);
        setIsCartOpen(false);
        toast.success("Finding the best partner for your service...");
        clearCart();

        await new Promise((resolve) => setTimeout(resolve, 3000));
        router.push('/user/dashboard');
      } else {
        const failedResult = results.find((result) => !result.success);
        throw new Error(
          failedResult?.error || "Failed to create order. Please try again."
        );
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      handleCheckoutError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckoutError = (errorMessage: string) => {
    if (errorMessage.includes("No service providers available")) {
      toast.error("No service providers are currently available in your area. Please try again later.");
    } else if (errorMessage.includes("Network")) {
      toast.error("Network error. Please check your internet connection.");
    } else if (errorMessage.includes("date")) {
      toast.error("Invalid booking date or time. Please select a valid date and time.");
    } else if (errorMessage.includes("pincode")) {
      toast.error("Service not available in this pincode area.");
    } else if (errorMessage.includes("slots")) {
      toast.error("Selected time slot is no longer available. Please choose another time.");
    } else {
      toast.error(errorMessage);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Categories Sidebar - Desktop */}
      <div className="hidden md:block w-64 bg-white p-4 shadow-lg h-full fixed top-24">
        <h2 className="text-xl font-semibold mb-4">Categories</h2>
        <ul className="space-y-1">
          {["all", ...Object.values(Category)].map((cat) => (
            <li
              key={cat}
              className={`cursor-pointer p-2 rounded-md ${
                category === cat
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => handleCategoryClick(cat)}
            >
              {cat === "all" ? "All Services" : categoryDisplayNames[cat as keyof typeof categoryDisplayNames]}
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-20 left-4 z-30 bg-white p-2 rounded-lg shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* Categories Sidebar - Mobile */}
      <div className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 ${
        isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className={`w-64 bg-white h-full transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 pt-20">
            <h2 className="text-xl font-semibold mb-4">Categories</h2>
            <ul className="space-y-2">
              {["all", ...Object.values(Category)].map((cat) => (
                <li
                  key={cat}
                  className={`cursor-pointer p-2 rounded-md ${
                    category === cat
                      ? "bg-black text-white"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => {
                    handleCategoryClick(cat);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {cat === "all" ? "All Services" : categoryDisplayNames[cat as keyof typeof categoryDisplayNames]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pt-24">
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search services..."
              className="w-full p-4 border border-gray-300 rounded-lg shadow-sm"
            />
          </div>
          <div className="relative sort-container">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="w-full md:w-auto px-6 py-4 md:py-0 bg-black text-white rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800"
            >
              <span>Sort</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isSortOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    handleSort('high-to-low');
                    setSortType('high-to-low');
                    setIsSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-2 rounded-t-lg hover:bg-gray-100 ${
                    sortType === 'high-to-low' ? 'bg-gray-200' : ''
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h9" />
                  </svg>
                  Price (High to Low)
                </button>
              
                <button
                  onClick={() => {
                    handleSort('low-to-high');
                    setSortType('low-to-high');
                    setIsSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-100 ${
                    sortType === 'low-to-high' ? 'bg-gray-200' : ''
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h5" />
                  </svg>
                  Price (Low to High)
                </button>
              
                <button
                  onClick={() => {
                    handleSort('top-orders');
                    setSortType('top-orders');
                    setIsSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-2 rounded-b-lg hover:bg-gray-100 ${
                    sortType === 'top-orders' ? 'bg-gray-200' : ''
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9M3 12h9" />
                  </svg>
                  Top Orders
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Services Grid */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <Image
                  src={service.image || "https://via.placeholder.com/150"}
                  alt={service.name}
                  className="w-full h-48 object-cover"
                  height={150}
                  width={150}
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">
                      ₹{service.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => addToCart(service)}
                      className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {isLoading ? (
              <p className="text-gray-500 text-center">Loading services...</p>
            ) : (
              <div>
                <p className="text-gray-500 text-center">No services found.</p>
                <button
                  onClick={() => { handleRequestClick(); setIsClicked(true); }}
                  disabled={isClicked}
                  className={`w-full h-10 rounded-lg font-bold text-lg transition-all duration-300
                  ${isClicked
                      ? 'bg-gray-400 text-gray-800 cursor-not-allowed'
                      : 'bg-black text-white cursor-pointer hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-500'
                    }`}
                >
                  {isClicked ? "Service Requested" : "Request Service"}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart Sidebar */}
      <aside
        className={`fixed right-0 top-0 h-full w-80 bg-white z-20 shadow-lg pt-[calc(6rem)] transform transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Cart ({cartItemCount})</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          {cart.length > 0 ? (
            <>
              <div className="flex-1 overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 border-b"
                  >
                    <Image
                      src={item.image || "https://via.placeholder.com/50"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                      height={50}
                      width={50}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        ₹{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 bg-gray-100 rounded"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 bg-gray-100 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>

                ))}
              </div>


              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 mb-2"
                >
                  Checkout
                </button>
                <button
                  onClick={clearCart}
                  className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
                >
                  Clear Cart
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          )}
        </div>
      </aside>

      {/* Cart Toggle Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-700 z-10 text-white p-4 rounded-full shadow-lg hover:bg-gray-600"
      >
        🛒 {cartItemCount > 0 && <span className="ml-1">{cartItemCount}</span>}
      </button>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        isProcessing={isProcessing}
        bookingDetails={bookingDetails}
        onClose={() => setIsCheckoutModalOpen(false)}
        onConfirm={handleCheckout}
        setBookingDetails={setBookingDetails}
        cartServices={cart}
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-lg">Connecting you to a partner...</p>
          </div>
        </div>
      )}
    </>
    );
  }