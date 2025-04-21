import type React from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Briefcase, Home, Wind, PenToolIcon as Tool, MoreHorizontal } from "lucide-react";
import Image from "next/image";

function ServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow mt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
            <div className="md:w-1/2 text-left space-y-6">
              <h1 className="text-4xl font-extrabold text-black sm:text-5xl md:text-6xl leading-tight">
                Our Services
              </h1>
              <p className="text-base text-gray-600 sm:text-lg md:text-xl leading-relaxed">
                Qwikly offers professional house, office, and AC cleaning
                services across India, delivering top-quality, eco-friendly solutions
                tailored to your needs. Our trusted team ensures your spaces are spotless,
                fresh, and well-maintained.
              </p>
            </div>

            <div className="md:w-1/2">
              <div className="relative w-full h-96">
                <Image
                  src="/logo.png"
                  alt="Qwikly Services"
                  fill
                  className="rounded-2xl object-cover shadow-xl"
                  priority
                />
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white shadow-lg rounded-2xl mb-16 transform hover:scale-[1.01] transition-transform duration-300">
            <div className="px-6 py-8 sm:px-8">
              <h2 className="text-3xl font-bold text-black mb-6 border-b border-gray-200 pb-4">
                About Qwikly
              </h2>
              <div className="space-y-6">
                <p className="text-gray-700 text-lg leading-relaxed">
                  Qwikly is a professional service provider based in Surat,
                  Gujarat. We specialize in house, office, and AC cleaning
                  services, as well as installations and other related services.
                </p>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Our top-quality, eco-friendly solutions are tailored to meet
                  each customer&#39;s unique needs. We focus on delivering exceptional
                  results and ensuring every project is handled with care and
                  professionalism.
                </p>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 mb-16">
            <ServiceCard
              icon={<Home className="h-8 w-8 text-black" />}
              title="House Cleaning"
              description="Comprehensive cleaning services for your home, ensuring a spotless and hygienic living environment."
            />
            <ServiceCard
              icon={<Briefcase className="h-8 w-8 text-black" />}
              title="Office Cleaning"
              description="Professional cleaning solutions for workspaces, promoting a clean and productive office environment."
            />
            <ServiceCard
              icon={<Wind className="h-8 w-8 text-black" />}
              title="AC Cleaning"
              description="Thorough cleaning and maintenance of air conditioning units to improve efficiency and air quality."
            />
            <ServiceCard
              icon={<Tool className="h-8 w-8 text-black" />}
              title="Installations"
              description="Expert installation services for various appliances and equipment in both homes and offices."
            />
            <ServiceCard
              icon={<MoreHorizontal className="h-8 w-8 text-black" />}
              title="And Much More"
              description="Discover our full range of professional services tailored to meet all your cleaning and maintenance needs."
            />
          </div>

          {/* Location and Instagram Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden transform hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-black p-6 bg-gray-50">
                Our Location
              </h3>
              <div className="aspect-w-16 aspect-h-9 h-[400px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3718.70349983633!2d72.84815527543446!3d21.24360298045997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xaf2e30a69314d2c9%3A0x801c0b6392faabac!2sHelper%20Buddy!5e0!3m2!1sen!2sin!4v1739825118680!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden transform hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-2xl font-semibold text-black p-6 bg-gray-50">
                Follow Us on Instagram
              </h3>
              <div className="aspect-w-16 aspect-h-9 h-[400px]">
                <iframe
                  src="https://www.instagram.com/Qwikly.in/embed"
                  className="w-full h-full"
                  frameBorder="0"
                  scrolling="no"
                  allowTransparency={true}
                ></iframe>
              </div>
              <div className="p-4 text-center">
                <a
                  href="https://www.instagram.com/Qwikly.in?igsh=bDZ3anI2amRjbXdp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black-600 hover:text-gray-800 font-medium"
                >
                  Visit our Instagram Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function ServiceCard({ icon, title, description }: ServiceCardProps) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-6 mx-auto">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-black mb-4 text-center">{title}</h3>
      <p className="text-gray-600 text-center leading-relaxed">{description}</p>
    </div>
  );
}

export default ServicePage;
