import { motion } from "framer-motion";
import { Star, ShieldCheck, Clock, CheckCircle2, Wrench, LogIn } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import beautyImg from "@assets/beauty.png";
import kitchenImg from "@assets/kitchen.png";
import massageImg from "@assets/massage.png";
import acImg from "@assets/ac.png";
import { useEffect, useState } from "react";
import { getParentServices, Service, getImageUrl } from "@/lib/services";

export function Hero() {
  const { isAuthenticated, setShowLoginModal } = useAuth();
  const [categories, setCategories] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getParentServices();
        if (data && data.length > 0) {
          setCategories(data);
        } else {
          // Fallback to mock data if API is empty? 
          // But mock data has string IDs, API has number IDs.
          // This might cause issues if I mix them.
          // Let's stick to API data or empty.
          // Actually, for the "first impression", maybe I should Map the mock data to the Service interface
          // if API fails?
          // No, let's trust the API.
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Helper to get color based on index or something, since API doesn't return color
  const getCategoryColor = (index: number) => {
    const colors = [
      "bg-blue-50 text-blue-600 hover:bg-blue-100",
      "bg-green-50 text-green-600 hover:bg-green-100",
      "bg-pink-50 text-pink-600 hover:bg-pink-100",
      "bg-gray-50 text-gray-600 hover:bg-gray-100",
      "bg-yellow-50 text-yellow-600 hover:bg-yellow-100",
      "bg-cyan-50 text-cyan-600 hover:bg-cyan-100",
      "bg-amber-50 text-amber-600 hover:bg-amber-100",
      "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    ];
    return colors[index % colors.length];
  };

  const displayCategories = categories.length > 0 ? categories : []; // If empty, main page will look empty? 
  // If categories are empty, maybe show skeletons?

  return (
    <section className="relative overflow-hidden bg-background pb-12 pt-6 md:pt-10">
      <div className="container mx-auto px-4 max-w-[1260px] relative">
        <div className="w-full md:w-[481px]">
          <h1 className="text-[36px] font-bold mb-8 text-foreground leading-tight">
            Home services at your doorstep
          </h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8 md:gap-[130px] items-start">
          {/* Left: Categories Box */}
          <div className="bg-white rounded-lg border-[0.8px] border-[#e3e3e3] px-6 py-8 pb-8 flex flex-col justify-between w-full md:w-[481px] shrink-0">
            <h2 className="text-[22px] font-semibold mb-6 text-foreground/80">What are you looking for?</h2>

            <div className="grid grid-cols-3 gap-y-4 gap-x-4">
              {loading ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="w-[96px] h-[72px] rounded-lg bg-[#f5f5f5] animate-pulse" />
                    <div className="h-3 w-16 bg-[#f5f5f5] animate-pulse rounded" />
                  </div>
                ))
              ) : (
                displayCategories.slice(0, 9).map((category) => (
                  <Link key={category.id} href={`/category/${category.id}`}>
                    <div className="flex flex-col items-center gap-3 cursor-pointer group">
                      <div className="w-[96px] h-[72px] bg-[#f5f5f5] rounded-lg flex items-center justify-center overflow-hidden transition-transform group-hover:-translate-y-1">
                        {category.imagePath ? (
                          <img src={getImageUrl(category.imagePath)} alt={category.name} className="w-[80%] h-[80%] object-contain" />
                        ) : (
                          <div className="scale-75 md:scale-90 transform">
                            <Wrench className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <span className="text-[14px] font-medium text-center text-[#0f0f0f] leading-tight px-1 line-clamp-2">
                        {category.name}
                      </span>
                    </div>
                  </Link>
                ))
              )}
              {!loading && displayCategories.length === 0 && (
                <div className="col-span-full py-6 flex flex-col items-center justify-center text-center space-y-3">
                  {!isAuthenticated ? (
                    <>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                        Please login for personalized service according to your Location
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-full border-primary/20 hover:bg-primary/5 text-primary font-medium transition-all"
                        onClick={() => setShowLoginModal(true)}
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Login / Sign up
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No services found.</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between pt-0">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-sm">4.8</span>
                <span className="text-xs text-muted-foreground">Service Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                  <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm">12M+</span>
                  <span className="text-[10px] text-muted-foreground">Customers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Image Collage */}
          <div className="hidden md:flex gap-2 w-full max-w-[616px] md:-mt-[110px]">
            {/* Left Column */}
            <div className="flex flex-col gap-2 w-1/2">
              <div className="h-[350px] overflow-hidden rounded-lg relative group">
                <img
                  src={beautyImg}
                  alt="Beauty Salon"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="h-[250px] overflow-hidden rounded-lg relative group">
                <img
                  src={kitchenImg}
                  alt="Kitchen Repair"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
            {/* Right Column */}
            <div className="flex flex-col gap-2 w-1/2">
              <div className="h-[250px] overflow-hidden rounded-lg relative group">
                <img
                  src={massageImg}
                  alt="Men's Massage"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="h-[350px] overflow-hidden rounded-lg relative group">
                <img
                  src={acImg}
                  alt="AC Repair"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
