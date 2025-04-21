import { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import HeroSection from "@/components/HeroSection"
import FAQSection from "@/components/FAQSection"
import HowItWorksSection from "@/components/HowItWorksSection"
import LatestArticles from "@/components/LatestBlogs"

// Dynamically import ServiceSection with SSR enabled
const ServiceSection = dynamic(() => import('@/components/ServicesSection'), {
  ssr: true
})

const ReviewSection = dynamic(() => import('@/components/ReviewSection'), {
  ssr: true
})


export const metadata: Metadata = {
  title: 'Qwykli - Professional Home Services at Your Doorstep',
  description: 'Book professional home services including cleaning, repairs, and maintenance. Trusted service providers, competitive prices, and satisfaction guaranteed.',
  keywords: 'home services, cleaning services, repair services, maintenance, professional services',
  openGraph: {
    title: 'Home Services - Professional Home Services at Your Doorstep',
    description: 'Book professional home services including cleaning, repairs, and maintenance. Trusted service providers, competitive prices, and satisfaction guaranteed.',
    type: 'website',
  },
}

export default async function Home() {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white">
      <Navbar />
      <HeroSection/>
      <ServiceSection />
      <HowItWorksSection />
      <ReviewSection />
      <LatestArticles/>
      <FAQSection/>
      <Footer />
    </div>
  )
}
