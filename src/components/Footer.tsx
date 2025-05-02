"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Facebook, Linkedin, Instagram, Mail, Phone, MapPin, LucideIcon } from "lucide-react";

// Interface for XIcon props
interface XIconProps {
  size?: number;
  className?: string;
}

// Custom X (Twitter) icon component
const XIcon: React.FC<XIconProps> = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Interfaces for data structures
interface ServiceLink {
  name: string;
  href: string;
}

interface Contact {
  phone: string;
  email: string;
  address: string;
}

interface SocialLink {
  name: string;
  icon: LucideIcon | React.FC<XIconProps>;
  href: string;
}

interface FooterLink {
  name: string;
  href: string;
}

const Footer: React.FC = () => {
  const [services, setServices] = useState<ServiceLink[]>([]);

  useEffect(() => {
    // Fetch services from the API
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services/footer");
        if (!response.ok) throw new Error("Failed to fetch services");

        const data = await response.json();

        const fetchedServices: ServiceLink[] = data.data.map((service: { name: string }) => {
          const params = new URLSearchParams();
          params.append("query", service.name);
          return {
            name: service.name,
            href: `/services?${params.toString()}`,
          };
        });

        setServices(fetchedServices);
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  const blogs: ServiceLink[] = [
    { name: "Latest Posts", href: "https://helpperbuddy.vercel.app/blogs?page=1" },
    { name: "Featured Insights", href: "https://helpperbuddy.vercel.app/blogs?page=2" }
  ];

  const contacts: Contact = {
    phone: "+91 6XXXXXXXX9",
    email: "hello@helperbuddy.in",
    address: "Amroli Cross Rd, near Santosh Electronics, Bhagu Nagar-1, Amroli, Surat, Gujarat 394107"
  };

  const socialLinks: SocialLink[] = [
    { name: "Facebook", icon: Facebook, href: "https://www.facebook.com/profile.php?id=61566410515044" },
    { name: "X", icon: XIcon, href: "https://twitter.com/helperbuddyin" },
    { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/company/helperbuddy/" },
    { name: "Instagram", icon: Instagram, href: "https://www.instagram.com/helperbuddy.in" }
  ];

  const footerLinks: FooterLink[] = [
    { name: "Services", href: "/services" },
    { name: "Blogs", href: "/blog" },
    { name: "About", href: "/about-us" },
    { name: "Contact Us", href: "/contactus" }
  ];

  return (
    <footer className="bg-black text-white pt-16 pb-8 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile and Tablet Layout */}
        <div className="lg:hidden flex flex-col space-y-8">
          {/* Logo */}
          <Link href="/" className="inline-block">
            <Image
              src="/logo.png"
              alt="Helper Buddy Logo"
              width={50}
              height={50}
              className="mb-6"
            />
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-4">
            {footerLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-lg font-semibold text-white hover:text-emerald-500 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Contact Information */}
          <div className="space-y-4 pt-8 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <Phone size={20} className="text-emerald-500" />
              <span>{contacts.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={20} className="text-emerald-500" />
              <span>{contacts.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-emerald-500" />
              <span>{contacts.address}</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-gray-800">
            <p className="text-gray-400 text-sm text-center">
              © {new Date().getFullYear()} HelperBuddy. All rights reserved.
            </p>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid grid-cols-4 gap-8">
          {/* Logo and Contact Info Section */}
          <div className="col-span-2">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="Helper Buddy Logo"
                width={150}
                height={50}
                className="mb-6"
              />
            </Link>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone size={20} className="text-emerald-500" />
                <span>{contacts.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-emerald-500" />
                <span>{contacts.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={20} className="text-emerald-500" />
                <span>{contacts.address}</span>
              </div>
            </div>
          </div>

          {/* Services and Blogs Section */}
          <div>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-6">Services</h3>
                <ul className="space-y-4">
                  {services.map((service) => (
                    <li key={service.name}>
                      <Link href={service.href} className="text-gray-400 hover:text-emerald-500 transition-colors">
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-6">Blog</h3>
                <ul className="space-y-4">
                  {blogs.map((blog) => (
                    <li key={blog.name}>
                      <Link href={blog.href} className="text-gray-400 hover:text-emerald-500 transition-colors">
                        {blog.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* About Us Section */}
          <div>
            <h3 className="text-lg font-semibold mb-6">About Us</h3>
            <p className="text-gray-400 mb-4">
              HelperBuddy offers professional house, office, and AC cleaning services across India, delivering top-quality, eco-friendly solutions tailored to your needs. Our trusted team ensures your spaces are spotless, fresh, and well-maintained.
            </p>
            <Link href="/contactus" className="text-emerald-500 hover:text-emerald-400 transition-colors">
              Contact Us →
            </Link>
          </div>
        </div>

        {/* Social Links and Copyright - Desktop Only */}
        <div className="hidden lg:block mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-emerald-500 transition-colors"
                  >
                    <Icon size={24} />
                  </a>
                );
              })}
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Helper Buddy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
