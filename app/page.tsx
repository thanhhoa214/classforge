import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

// export const metadata = {
//   title: "Landing Page",
//   description: "A landing page with parallax scrolling effects.",
//   openGraph: {
//     title: "Landing Page",
//     description: "A landing page with parallax scrolling effects.",
//     url: "https://example.com/landing-page",
//     siteName: "Landing Page",
//   },
// };

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-indigo-50">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
