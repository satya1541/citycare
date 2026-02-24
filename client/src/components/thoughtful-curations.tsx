import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

interface CurationItem {
  id: number;
  title: string;
  subtitle: string;
  videoUrl: string;
  price?: string;
  badge?: string;
  serviceLink: string;
}

const curations: CurationItem[] = [
  {
    id: 1,
    title: "Kitchen Deep Cleaning",
    subtitle: "Professional cleaning with eco-friendly chemicals",
    videoUrl: "/videos/kitchen cleaning.mp4",
    price: "₹899",
    badge: "OUR FINEST EXPERIENCES",
    serviceLink: "/service/2",  // Kitchen Cleaning
  },
  {
    id: 2,
    title: "Bathroom Cleaning",
    subtitle: "Sparkling clean tiles and sanitized fixtures",
    videoUrl: "/videos/bathroom cleaning.mp4",
    price: "₹499",
    badge: "MOST BOOKED",
    serviceLink: "/service/3",  // Bathroom Cleaning
  },
  {
    id: 3,
    title: "Sofa Cleaning",
    subtitle: "Deep shampooing & stain removal",
    videoUrl: "/videos/sofa cleaning.mp4",
    price: "₹499",
    badge: "POPULAR",
    serviceLink: "/service/1",  // Sofa & Carpet Cleaning
  },
  {
    id: 4,
    title: "AC Service & Repair",
    subtitle: "Complete AC servicing by certified technicians",
    videoUrl: "/videos/ac service and repair.mp4",
    price: "₹399",
    badge: "TRENDING",
    serviceLink: "/service/8",  // Cleaning Service (parent)
  },
  {
    id: 5,
    title: "Car Cleaning",
    subtitle: "Premium car detailing at your doorstep",
    videoUrl: "/videos/car cleaning.mp4",
    price: "₹599",
    badge: "NEW",
    serviceLink: "/service/27",  // Car Services
  },
  {
    id: 6,
    title: "Home Deep Cleaning",
    subtitle: "Complete home transformation in hours",
    videoUrl: "/videos/home deep cleaning.mp4",
    price: "₹1999",
    badge: "OUR FINEST EXPERIENCES",
    serviceLink: "/service/4",  // Apartment Cleaning
  },
  {
    id: 7,
    title: "House Cleaning",
    subtitle: "Regular maintenance cleaning service",
    videoUrl: "/videos/house cleaning.mp4",
    price: "₹799",
    badge: "POPULAR",
    serviceLink: "/service/26",  // Home Cleaning
  },
];

export function ThoughtfulCurations() {
  const { isAuthenticated, setShowLoginModal, setLoginReason } = useAuth();
  const [selectedVideo, setSelectedVideo] = useState<CurationItem | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const visible = 4;
  const count = curations.length;
  const extendedItems = count > visible
    ? [...curations, ...curations.slice(0, visible)]
    : curations;
  const totalSlides = count;

  const goNext = useCallback(() => {
    if (count <= visible) return;

    setOffset((prev) => {
      // If we are already at the end of the original slides,
      // snap back to 0 instantly, then animate to 1
      if (prev >= totalSlides) {
        setIsAnimating(false);
        setTimeout(() => {
          setIsAnimating(true);
          setOffset(1);
        }, 50);
        return 0;
      }
      setIsAnimating(true);
      return prev + 1;
    });
  }, [count, totalSlides]);

  const goPrev = useCallback(() => {
    if (count <= visible) return;
    setIsAnimating(true);
    setOffset((prev) => {
      if (prev <= 0) return totalSlides - 1;
      return prev - 1;
    });
  }, [count, totalSlides]);

  // Snap back when reaching cloned region
  useEffect(() => {
    if (offset === totalSlides && count > visible) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setOffset(0);
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [offset, totalSlides, count]);

  // Auto-play
  useEffect(() => {
    if (count <= visible || isPaused || selectedVideo) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(goNext, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, goNext, isPaused, selectedVideo]);

  // When modal opens, play the video from start
  useEffect(() => {
    if (selectedVideo && modalVideoRef.current) {
      modalVideoRef.current.currentTime = 0;
      modalVideoRef.current.play().catch(() => {
        // Browser may block autoplay — safe to ignore
      });
    }
  }, [selectedVideo]);

  const itemCount = extendedItems.length;
  const trackWidth = (itemCount / visible) * 100;
  const shiftPct = (offset / itemCount) * 100;
  const gapPx = 16;

  // Navigate between videos in modal
  const modalPrev = () => {
    if (!selectedVideo) return;
    const idx = curations.findIndex((c) => c.id === selectedVideo.id);
    setSelectedVideo(curations[(idx - 1 + count) % count]);
  };
  const modalNext = () => {
    if (!selectedVideo) return;
    const idx = curations.findIndex((c) => c.id === selectedVideo.id);
    setSelectedVideo(curations[(idx + 1) % count]);
  };

  // Progress indicator for modal
  const currentModalIndex = selectedVideo
    ? curations.findIndex((c) => c.id === selectedVideo.id)
    : 0;

  return (
    <>
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-1">Thoughtful curations</h2>
          <p className="text-sm text-muted-foreground mb-6 italic">
            of our finest experiences
          </p>

          <div
            className="relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="overflow-hidden">
              <div
                className={`flex ${isAnimating ? "transition-transform duration-700 ease-in-out" : ""}`}
                style={{
                  gap: `${gapPx}px`,
                  transform: count > visible
                    ? `translateX(-${offset * (288 + gapPx)}px)`
                    : "none",
                }}
              >
                {extendedItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="flex-shrink-0 cursor-pointer"
                    style={{ width: '288px' }}
                    onClick={() => {
                      if (!isAuthenticated) {
                        setLoginReason("Please login for best services according to your location");
                        setShowLoginModal(true);
                        return;
                      }
                      setIsMuted(true);
                      setSelectedVideo(item);
                    }}
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-gray-900 group/card" style={{ width: '288px', height: '512px' }}>
                      <video
                        src={item.videoUrl}
                        muted
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {/* Title at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-base md:text-lg leading-tight drop-shadow-lg">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation arrows */}
            {count > visible && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={() => setSelectedVideo(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 w-[320px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Video + overlays */}
              <div className="relative rounded-t-2xl overflow-hidden bg-black h-[450px]">
                <video
                  ref={modalVideoRef}
                  src={selectedVideo.videoUrl}
                  muted={isMuted}
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Progress bar - inside video at top */}
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3">
                  {curations.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-[3px] rounded-full flex-1 transition-all duration-300 ${idx === currentModalIndex
                        ? "bg-white"
                        : idx < currentModalIndex
                          ? "bg-white/60"
                          : "bg-white/30"
                        }`}
                    />
                  ))}
                </div>

                {/* Close button - top right inside video */}
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Mute toggle */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute top-12 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors z-20"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {/* Gradient at bottom */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-16 pb-4 px-4">
                  <p className="text-white/80 text-sm">{selectedVideo.subtitle}</p>
                </div>

                {/* Prev/Next navigation */}
                <button
                  onClick={modalPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors z-20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={modalNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors z-20"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Service info card */}
              <div className="bg-[#2a2a2a] rounded-b-2xl p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-3">
                  <h3 className="text-white font-semibold text-sm leading-tight truncate">
                    {selectedVideo.title}
                  </h3>
                  <p className="text-white/70 text-xs mt-0.5">{selectedVideo.price}</p>
                  {selectedVideo.badge && (
                    <p className="text-amber-400 text-[10px] font-semibold mt-1 flex items-center gap-1">
                      ★ {selectedVideo.badge}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedVideo(null);
                    window.location.href = selectedVideo.serviceLink;
                  }}
                  className="bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors whitespace-nowrap shrink-0"
                >
                  View more
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
