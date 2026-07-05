'use client';

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
}

const fetchServices = async () => {
  const res = await fetch('/api/home-page/services');
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
};

const ServiceSection: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [cardsToShow, setCardsToShow] = useState(3);

  useEffect(() => {
    fetchServices().then(setServices).catch(console.error);
  }, []);

  // Enhanced responsive handling
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardsToShow(1);
      } else if (window.innerWidth < 1024) {
        setCardsToShow(2);
      } else {
        setCardsToShow(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextSlide = useCallback(() => {
    setSlideDirection('right');
    setCurrentIndex((prev) => {
      const nextIndex = prev + cardsToShow;
      return nextIndex >= services.length ? 0 : nextIndex;
    });
  }, [services.length, cardsToShow]);

  const prevSlide = useCallback(() => {
    setSlideDirection('left');
    setCurrentIndex((prev) => {
      const prevIndex = prev - cardsToShow;
      return prevIndex < 0 ? Math.max(0, services.length - cardsToShow) : prevIndex;
    });
  }, [services.length, cardsToShow]);

  useEffect(() => {
    if (!autoPlay || !services.length) return;
    
    const intervalId = setInterval(() => {
      setSlideDirection('right');
      nextSlide();
    }, 4000);
    
    return () => clearInterval(intervalId);
  }, [autoPlay, nextSlide, services.length]);

  if (!services.length) return null;

  const visibleServices = [...services.slice(currentIndex, currentIndex + cardsToShow)];
  
  if (visibleServices.length < cardsToShow) {
    visibleServices.push(...services.slice(0, cardsToShow - visibleServices.length));
  }

  const slideVariants = {
    enter: (direction: string) => ({
      x: direction === 'right' ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: string) => ({
      x: direction === 'right' ? -1000 : 1000,
      opacity: 0
    })
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-center dark:text-white mb-4 sm:mb-0">
            Our Services
          </h2>
          <Link 
            href="/services" 
            className="text-black dark:text-white hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="relative">
          <div className="flex items-center">
            <button
              onClick={() => {
                prevSlide();
                setAutoPlay(false);
              }}
              className="p-2 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors z-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
            
            <div className="overflow-hidden mx-2 sm:mx-4 flex-1">
              <AnimatePresence
                mode="wait"
                initial={false}
                custom={slideDirection}
              >
                <motion.div
                  key={currentIndex}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                >
                  {visibleServices.map((service) => (
                    <motion.div
                      key={service.id}
                      whileHover={{ scale: 1.02 }}
                      className="w-full"
                    >
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg h-[400px] sm:h-[500px] flex flex-col">
                        {service.image ? (
                          <div className="relative h-36 sm:h-48 w-full flex-shrink-0">
                            <Image
                              src={service.image}
                              alt={service.name}
                              className="object-cover"
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              priority
                            />
                          </div>
                        ) : (
                          <div className="h-36 sm:h-48 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                        )}
                        <div className="p-4 sm:p-6 flex flex-col flex-grow">
                          <h3 className="text-lg sm:text-xl font-semibold mb-2 dark:text-white">
                            {service.name}
                          </h3>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 flex-grow line-clamp-4">
                            {service.description}
                          </p>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mt-4">
                            <span className="text-xl sm:text-2xl font-bold dark:text-white">
                              ₹{service.price}
                            </span>
                            <Link
                              href={`/services?query=${encodeURIComponent(service.name)}`}
                              className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black px-4 sm:px-6 py-2 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-center text-sm sm:text-base"
                            >
                              Book Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
            
            <button
              onClick={() => {
                nextSlide();
                setAutoPlay(false);
              }}
              className="p-2 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors z-10"
              aria-label="Next slide"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceSection;