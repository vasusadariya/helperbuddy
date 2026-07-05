'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search,  Menu, X, User, LogOut, LayoutDashboard, Wallet } from 'lucide-react';
import { LucideIcon } from "lucide-react";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: LucideIcon;
}

interface ExtendedSession extends Session {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

interface ServiceResult {
  id: string;
  name: string;
  price: number;
  description: string;
}

export default function Navbar() {
  const { data: session } = useSession() as { data: ExtendedSession | null };
  const router = useRouter();

  const isAuthenticated = !!session;
  const userRole = session?.user?.role;
  const userName = session?.user?.name;
  const [walletBalance, setWalletBalance] = useState(0);

  const [scrolling, setScrolling] = useState(false);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isClicked, setIsClicked] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [showWalletTooltip, setShowWalletTooltip] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolling(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'USER') {
      setWalletBalance(0);
      return;
    }

    let cancelled = false;
    fetch('/api/wallet')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) {
          setWalletBalance(data.data.wallet.balance);
        }
      })
      .catch((err) => console.error('Error fetching wallet balance:', err));

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userRole]);

  const fetchServices = async (query: string) => {
    if (!query) return setResults([]);
    setIsClicked(false);
    setLoading(true);
    try {
      const res = await fetch('/api/services/home-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchServices(query);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleDashboardRedirect = () => {
    switch (userRole) {
      case 'ADMIN':
        router.push('/admin/dashboard');
        break;
      case 'PARTNER':
        router.push('/partner/dashboard');
        break;
      case 'USER':
        router.push('/user/dashboard');
        break;
      default:
        router.push('/');
        break;
    }
    setDropdownOpen(false);
    setLoading(false);
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
    } catch (error) {
      console.error("Error requesting service:", error);
    }
  };

  const NavLink = ({ href, children, icon: Icon }: NavLinkProps) => (
    <Link href={href} className="group flex items-center space-x-2">
      {Icon && <Icon className="w-5 h-5 text-gray-600 group-hover:text-black transition-colors duration-300" />}
      <span className="font-light text-gray-700 group-hover:text-black transition-colors duration-300 relative">
        {children}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full" />
      </span>
    </Link>
  );

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolling ? 'backdrop-blur-lg bg-white/50 shadow-md' : 'bg-white'
        }`}
    >
      <div className="bg-black text-white border-b text-center py-2 text-sm font-medium">
        We are AVAILABLE in Mumbai, Surat
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-8">
          {/* Logo */}
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 shrink-0">
            <Image className="h-10 w-auto" src="/logo.png" alt="Helper Buddy" width={40} height={40} />
            <span className="hidden md:block text-2xl font-extrabold text-black tracking-wide">HelperBuddy</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex items-center space-x-8">
            <NavLink href="/services" >Services</NavLink>
            <NavLink href="/blogs">Blogs</NavLink>
            <NavLink href="/contactus">Contact Us</NavLink>
            <NavLink href="/about-us">About Us</NavLink>
          </div>

          {/* Search Bar */}
          {/* Search Bar with Dropdown */}
          <div className="hidden md:flex flex-1 justify-center max-w-md">
            <div className="w-full max-w-sm relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a service..."
                className="w-full px-6 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all shadow-sm"
              />
              {loading ? (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-gray-400 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8V12H4z"></path>
                  </svg>
                </div>
              ) : (
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              )}

              {/* Search Results Dropdown */}
              {query && (
                <div className="absolute left-0 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {results.length > 0 ? (
                    results.map((service) => (
                      <div
                        key={service.id}
                        className="p-4 border-b last:border-none hover:bg-gray-50 cursor-pointer transition"
                        onClick={() => {
                          const params = new URLSearchParams();
                          params.append("query", service.name);
                          window.location.href = `/services?${params.toString()}`;
                        }}
                      >
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {loading ? (
                        <p className="text-gray-500 text-center">Loading services...</p>
                      ) : (
                        <div>
                          <p className="text-gray-500 text-center">No services found.</p>
                          {query.length > 4 && (
                            <button
                              onClick={() => { handleRequestClick(); setIsClicked(true); }}
                              disabled={isClicked}
                              className={`w-full h-8 rounded-lg font-bold text-lg transition-all duration-300
                              ${isClicked
                                  ? 'bg-gray-400 text-gray-800 cursor-not-allowed'
                                  : 'bg-black text-white cursor-pointer hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-500'
                                }`}
                            >
                              {isClicked ? "Service Requested" : "Request Service"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* <button className="hover:scale-110 transition-transform duration-300">
              <MapPin className="w-6 h-6 text-gray-600 hover:text-black transition-colors duration-300" />
            </button> */}

            {!isAuthenticated && (
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="hidden md:block px-6 py-3 text-white bg-black rounded-lg shadow-lg transition-all hover:bg-black/90 hover:shadow-xl"
                >
                  Register as Partner
                </motion.button>
              </Link>
            )}

            {/* Wallet Icon for User Role */}
            {isAuthenticated && userRole === 'USER' && (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onMouseEnter={() => setShowWalletTooltip(true)}
                  onMouseLeave={() => setShowWalletTooltip(false)}
                  onClick={() => router.push('/user/dashboard/transactions')}
                  className="p-2 rounded-full hover:bg-gray-100 transition-all"
                >
                  <Wallet className="w-5 h-5 text-gray-600" />
                </motion.button>
                <AnimatePresence>
                  {showWalletTooltip && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border p-4 min-w-[200px]"
                    >
                      <div className="text-sm font-medium text-gray-600">Wallet Balance</div>
                      <div className="text-2xl font-bold text-black">₹{walletBalance.toFixed(2)}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => { setDropdownOpen(!dropdownOpen); setLoading(true); }}
                className="p-2 rounded-full hover:bg-gray-100 transition-all flex items-center space-x-3"
              >
                {isAuthenticated ? (
                  <>
                    <div className="hidden lg:block text-right">
                      <p className="text-sm font-medium text-black">{userName}</p>
                      <p className="text-xs text-gray-500">{userRole}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  </>
                ) : (
                  <User className="w-5 h-5 text-gray-600" />
                )}
              </motion.button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border overflow-hidden"
                  >
                    {isAuthenticated ? (
                      <div className="p-3 space-y-2">
                        <div className="px-3 py-2 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500">Signed in as</p>
                          <p className="font-medium text-black">{userName}</p>
                          <p className="text-xs text-gray-500">{userRole}</p>
                        </div>
                        <button
                          onClick={handleDashboardRedirect}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all"
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          <span>Dashboard</span>
                        </button>
                        <button
                          onClick={() => signOut()}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 space-y-2">
                        <Link href="/signin">
                          <button className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all">
                            Login
                          </button>
                        </Link>
                        <Link href="/signup">
                          <button className="w-full text-left px-4 py-3 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-lg transition-all">
                            Sign Up
                          </button>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden rounded-lg p-2 hover:bg-gray-100 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t bg-white"
          >
            <div className="max-w-7xl mx-auto p-4 space-y-4">
              {/* Mobile Search */}
              {/* Mobile Search */}
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for a service..."
                  className="w-full px-6 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                />
                {loading ? (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <svg className="w-5 h-5 text-gray-400 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018 8V12H4z"></path>
                    </svg>
                  </div>
                ) : (
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                )}

                {/* Mobile Search Results Dropdown */}
                {query && (
                  <div className="absolute left-0 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                    {results.length > 0 ? (
                      results.map((service) => (
                        <div
                          key={service.id}
                          className="p-4 border-b last:border-none hover:bg-gray-50 cursor-pointer transition"
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.append("query", service.name);
                            window.location.href = `/services?${params.toString()}`;
                            setMobileMenuOpen(false); // Close mobile menu after selection
                          }}
                        >
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {loading ? (
                          <p className="text-gray-500 text-center">Loading services...</p>
                        ) : (
                          <div>
                            <p className="text-gray-500 text-center">No services found.</p>
                            {query.length > 4 && (
                              <button
                                onClick={() => {
                                  handleRequestClick();
                                  setIsClicked(true);
                                  setMobileMenuOpen(false); // Close mobile menu after request
                                }}
                                disabled={isClicked}
                                className={`w-full h-8 mt-2 rounded-lg font-bold text-lg transition-all duration-300
                    ${isClicked
                                    ? 'bg-gray-400 text-gray-800 cursor-not-allowed'
                                    : 'bg-black text-white cursor-pointer hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-500'
                                  }`}
                              >
                                {isClicked ? "Service Requested" : "Request Service"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                <Link href="/services" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all">
                  
                  <span className="text-gray-600 hover:text-black">Services</span>
                </Link>
                <Link href="/blogs" className="p-3 rounded-lg hover:bg-gray-50 transition-all text-gray-600 hover:text-black">
                  Blogs
                </Link>
                <Link href="/contactus" className="p-3 rounded-lg hover:bg-gray-50 transition-all text-gray-600 hover:text-black">
                  Contact Us
                </Link>
                <Link href="/about-us" className="p-3 rounded-lg hover:bg-gray-50 transition-all text-gray-600 hover:text-black">
                  About Us
                </Link>
              </div>

              {!isAuthenticated ? (
                <div className="grid gap-3 pt-4 border-t z-20">
                  <Link href="/signin">
                    <button className="w-full px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                      Login
                    </button>
                  </Link>
                  <Link href="/signup">
                    <button className="w-full px-4 py-3 text-white bg-black rounded-lg hover:bg-black/90 transition-all">
                      Sign Up
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="w-full px-4 py-3 text-white bg-black rounded-lg hover:bg-black/90 transition-all">
                      Register as Partner
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-3 pt-4 border-t">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="font-medium text-black">{userName}</p>
                    <p className="text-xs text-gray-500">{userRole}</p>
                  </div>
                  <button
                    onClick={handleDashboardRedirect}
                    className="w-full px-4 py-3 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Dashboard</span>
                  </button>
                  {userRole === 'USER' && (
                    <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-5 h-5 text-gray-600" />
                        <span className="text-sm text-gray-600">Wallet Balance</span>
                      </div>
                      <span className="text-lg font-bold text-black">₹{walletBalance.toFixed(2)}</span>
                    </div>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="w-full px-4 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
