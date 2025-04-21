"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"

const images = [
  "https://assets.zyrosite.com/cdn-cgi/image/format=auto,w=1920,fit=crop/AzGeNv8QxRTqXJan/people-taking-care-office-cleaning-AzG3G22GvPhxw7eO.jpg",
  "https://img.freepik.com/free-photo/part-male-construction-worker_329181-3734.jpg?t=st=1739610307~exp=1739613907~hmac=e1c2ae6d2ae9e52afc7135d98d006c8de0c54805d76f4a1b59a2da869b545ae7&w=996"
]

const ButtonWithArrow = () => {
  return (
    <Link href="/services">
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1, delay: 0.1 }}
        className="group relative inline-flex items-center mt-3 gap-1.5 sm:gap-2 overflow-hidden rounded-full border border-white px-4 py-2 sm:px-5 sm:py-3 md:px-6 md:py-3 text-xs sm:text-sm md:text-base font-medium text-white transition-transform"
      >
        <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
          Explore Services
        </span>
        <span className="relative z-10 flex items-center justify-center">
          <span className="flex h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 bg-black items-center justify-center rounded-full transition-colors duration-500 group-hover:border-black">
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 -rotate-45 transition-transform duration-100 group-hover:translate-x-1 group-hover:-translate-y-1" />
          </span>
        </span>
        <div className="absolute left-0 top-0 h-full w-full -translate-x-full transform bg-white transition-transform duration-500 group-hover:translate-x-0" />
      </motion.button>
    </Link>
  )
}

interface ServiceCardProps {
  title: string;
  description: string;
}

const ServiceCard = ({ title, description }: ServiceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="bg-white/10 backdrop-blur-md rounded-lg p-3 sm:p-4 md:p-6 w-full max-w-[280px] sm:max-w-[300px] mx-auto"
    >
      <h3 className="text-white text-base sm:text-lg md:text-xl font-semibold mb-2 text-center">{title}</h3>
      <p className="text-gray-200 text-xs sm:text-sm md:text-base text-center">{description}</p>
    </motion.div>
  )
}

export default function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextImage = useCallback(() => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isAutoPlaying) {
      intervalId = setInterval(() => {
        nextImage();
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoPlaying, nextImage]);

  const handleImageChange = (index: number) => {
    setCurrentImage(index);
    setIsAutoPlaying(false);
    
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  return (
    <div className="w-full bg-white p-3 mt-24 sm:p-4 md:p-6 lg:p-8 pt-20 sm:pt-24 md:pt-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[1600px] mx-auto relative overflow-hidden rounded-2xl sm:rounded-[2rem] min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px]"
      >
        {/* Background Images Container */}
        <div className="absolute inset-0 bg-black">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.8,
                ease: "easeInOut"
              }}
              className="absolute inset-0"
            >
              <div className="relative w-full h-full">
                <Image
                  src={images[currentImage]}
                  alt={`Carousel image ${currentImage + 1}`}
                  className="object-cover opacity-80"
                  priority
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1600px"
                  style={{ objectPosition: 'center' }}
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Navigation */}
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-20 flex gap-1.5 sm:gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => handleImageChange(index)}
              className={`w-8 sm:w-10 md:w-12 h-1.5 sm:h-2 rounded-sm transition-all duration-300 ${
                currentImage === index 
                  ? 'bg-white' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="relative h-full flex flex-col justify-between px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-16 lg:py-12">
          {/* Top Content */}
          <div className="max-w-[600px] space-y-3 sm:space-y-4 md:space-y-6 pt-2 sm:pt-4 md:pt-6 mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight"
            >
              Reliable, Fast & Affordable Services
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-200 max-w-xl mx-auto"
            >
              Your Qwykli is Just a Click Away
            </motion.p>
            <div className="flex justify-center">
              <ButtonWithArrow />
            </div>
          </div>

          {/* Services Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8 mb-12 sm:mb-16 md:mb-20 max-w-5xl mx-auto px-2 sm:px-4">
            <ServiceCard
              title="Home & Office Cleaning"
              description="Expert cleaning tailored to your space, using eco-friendly products"
            />
            <ServiceCard
              title="Appliance Repair & Maintenance"
              description="Quick, reliable appliance repairs and maintenance"
            />
            <ServiceCard
              title="Plumbing & Electrical"
              description="Trusted plumbing and electrical services, with emergency response"
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}
