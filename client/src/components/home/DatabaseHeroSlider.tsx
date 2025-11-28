import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type HeroImage = {
  filename: string;
  url: string;
};

export function DatabaseHeroSlider() {
  const [_, setLocation] = useLocation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  
  // Fetch hero slider images from the backend
  const { data: heroImages = [] } = useQuery<HeroImage[]>({
    queryKey: ['/api/herosliders'],
    queryFn: () => apiRequest('GET', '/api/herosliders')
      .then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Auto-play functionality
  useEffect(() => {
    if (!emblaApi || heroImages.length <= 1) return;
    
    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000); // 5 seconds interval

    // Clear interval when user interacts with the carousel
    const onInteractionStarted = () => {
      clearInterval(intervalId);
    };
    
    emblaApi.on('pointerDown', onInteractionStarted);
    
    return () => {
      clearInterval(intervalId);
      if (emblaApi) {
        emblaApi.off('pointerDown', onInteractionStarted);
      }
    };
  }, [emblaApi, heroImages.length]);

  // If no hero images, don't render anything
  if (heroImages.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
          {heroImages.map((image) => (
            <div 
              key={image.filename} 
              className="flex-[0_0_100%] min-w-0 relative"
            >
              <div className="absolute inset-0">
                <img 
                  src={image.url} 
                  alt="Hero slider image" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end pb-16 sm:items-center">
                  <div className="container mx-auto px-4 md:px-8">
                    <div className="max-w-md">
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-white py-2 px-6"
                        onClick={() => setLocation("/auth")}
                      >
                        Start Betting Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation buttons - only show if more than one slide */}
      {heroImages.length > 1 && (
        <>
          <button 
            onClick={scrollPrev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 sm:p-2 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          <button 
            onClick={scrollNext}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-1 sm:p-2 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
          
          {/* Dots indicators */}
          <div className="absolute bottom-2 sm:bottom-4 left-0 right-0 flex justify-center">
            <div className="flex space-x-1.5 sm:space-x-2">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                    index === selectedIndex
                      ? 'bg-white scale-100'
                      : 'bg-white/50 scale-75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}