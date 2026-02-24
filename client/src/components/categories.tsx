import { Link } from "wouter";
import { Service, getImageUrl } from "@/lib/services";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoriesProps {
  parents: Service[];
  loading: boolean;
}

const bannerGradients = [
  "from-blue-900/80 via-blue-900/40 to-transparent",
  "from-purple-900/80 via-purple-900/40 to-transparent",
  "from-green-900/80 via-green-900/40 to-transparent",
  "from-rose-900/80 via-rose-900/40 to-transparent",
  "from-amber-900/80 via-amber-900/40 to-transparent",
  "from-teal-900/80 via-teal-900/40 to-transparent",
];

export function Categories({ parents, loading }: CategoriesProps) {
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleCount, setVisibleCount] = useState(2);

  const count = parents.length;

  useEffect(() => {
    // Initial check
    const checkWidth = () => {
      const isMobile = window.innerWidth < 768;
      const newVisible = isMobile ? 1 : 2;

      if (visibleCount !== newVisible) {
        setVisibleCount(newVisible);
        setOffset(newVisible);
        setIsAnimating(false);
      }
    };

    // Set initially on mount
    if (offset === 0) {
      const isMobile = window.innerWidth < 768;
      const initialVisible = isMobile ? 1 : 2;
      setVisibleCount(initialVisible);
      if (count > 0) setOffset(initialVisible);
    }

    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [count]);

  // Clones: [Last visibleCount] + [Full List] + [First visibleCount]
  const extendedItems = count > 0 ? [...parents.slice(-visibleCount), ...parents, ...parents.slice(0, visibleCount)] : [];

  const goNext = useCallback(() => {
    if (count <= visibleCount) return;
    setIsAnimating(true);
    setOffset((prev) => prev + 1);
  }, [count, visibleCount]);

  const goPrev = useCallback(() => {
    if (count <= visibleCount) return;
    setIsAnimating(true);
    setOffset((prev) => prev - 1);
  }, [count, visibleCount]);

  // Infinite loop snap logic
  useEffect(() => {
    if (count <= visibleCount) return;

    // If we've reached the end clones
    if (offset >= count + visibleCount) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setOffset(visibleCount);
      }, 700);
      return () => clearTimeout(timeout);
    }

    // If we've reached the start clones
    if (offset <= 0) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setOffset(count);
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [offset, count]);

  // Auto-play
  useEffect(() => {
    if (count <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(goNext, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, goNext, isPaused]);

  if (loading) {
    return (
      <section className="bg-background">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="rounded-2xl h-44" />
            <Skeleton className="rounded-2xl h-44 hidden md:block" />
          </div>
        </div>
      </section>
    );
  }

  if (count === 0) return null;

  if (count <= visibleCount) {
    return (
      <section className="bg-background">
        <div className="container mx-auto">
          <div className={`grid gap-6 ${visibleCount === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {parents.map((parent, idx) => (
              <BannerCard key={parent.id} parent={parent} idx={idx} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Each item occupies 1/extendedItems.length of the track
  const itemCount = extendedItems.length;
  const trackWidthPercent = (itemCount / visibleCount) * 100;
  const shiftPercent = (offset / itemCount) * 100;
  // Gap in px between items
  const gapPx = 24;

  const handleMouseEnter = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) {
      setIsPaused(false);
    }
  };

  return (
    <section className="bg-background">
      <div className="container mx-auto">
        <div
          className="relative group"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="overflow-hidden rounded-2xl">
            <div
              className={`flex ${isAnimating ? "transition-transform duration-700 ease-in-out" : ""}`}
              style={{
                width: `${trackWidthPercent}%`,
                gap: `${gapPx}px`,
                transform: `translateX(calc(-${shiftPercent}% - ${offset * (gapPx / itemCount)}px))`,
              }}
            >
              {extendedItems.map((parent, idx) => (
                <div
                  key={`${parent.id}-${idx}`}
                  className="flex-shrink-0"
                  style={{ width: `calc(${100 / itemCount}% - ${((itemCount - 1) * gapPx) / itemCount}px)` }}
                >
                  <BannerCard parent={parent} idx={idx % count} />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 shadow-md flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 shadow-md flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>



        </div>
      </div>
    </section>
  );
}

function BannerCard({ parent, idx }: { parent: Service; idx: number }) {
  return (
    <Link href={`/service/${parent.id}`}>
      <div className="rounded-2xl overflow-hidden relative h-44 group/card cursor-pointer shadow-md">
        <img
          src={getImageUrl(parent.imagePath)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
          alt={parent.name}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-r ${bannerGradients[idx % bannerGradients.length]
            } flex flex-col justify-center px-8 text-white`}
        >
          <h3 className="text-xl md:text-2xl font-bold mb-1">{parent.name}</h3>
          {parent.description && (
            <p className="text-xs md:text-sm opacity-90 mb-3 font-medium line-clamp-2 max-w-[280px]">
              {parent.description}
            </p>
          )}
          <span className="inline-block bg-white text-black px-4 py-2 rounded-lg text-sm font-bold w-fit hover:bg-gray-100 transition-colors">
            Explore
          </span>
        </div>
      </div>
    </Link>
  );
}
