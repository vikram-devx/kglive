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

// Default slides in case no images are in the database yet
const defaultSlides = [
  {
    id: "slide1",
    title: "The Premier Betting Platform",
    description: "Experience the thrill of betting with real-time results and attractive payouts. Play anywhere, anytime.",
    backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    buttonText: "Start Betting Now",
    buttonLink: "/auth"
  },
  {
    id: "slide2",
    title: "Market Games",
    description: "Play exciting market-based games with multiple options and win big payouts.",
    backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    buttonText: "Play Market Games",
    buttonLink: "/auth"
  },
  {
    id: "slide3",
    title: "Sports Betting",
    description: "Bet on your favorite sports teams and win big with our competitive odds.",
    backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    buttonText: "Start Sports Betting",
    buttonLink: "/auth"
  }
];

export function HomePageHeroSlider() {
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
    if (!emblaApi) return;
    
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
  }, [emblaApi]);

  // Define a union type for both slide types
  type Slide = 
    | { id: string; title: string; description: string; backgroundImage: string; buttonText: string; buttonLink: string; isCustomImage?: false; }
    | { id: string; image: string; isCustomImage: true; };

  // If no images are available from the backend, use default slides
  const slidesToUse: Slide[] = heroImages.length > 0
    ? heroImages.map((image) => ({
        id: image.filename,
        image: image.url,
        isCustomImage: true as const
      }))
    : defaultSlides.map(slide => ({
        ...slide,
        isCustomImage: false as const
      }));

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
          {slidesToUse.map((slide) => (
            <div 
              key={slide.id} 
              className="flex-[0_0_100%] min-w-0 relative"
            >
              {slide.isCustomImage ? (
                // Render custom image from the backend
                <div className="absolute inset-0">
                  <img 
                    src={slide.image} 
                    alt="Hero Image" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/40">
                    {/* Removed button as requested */}
                  </div>
                </div>
              ) : (
                // Render default slides with text
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    background: slide.backgroundImage.startsWith('linear-gradient') 
                      ? slide.backgroundImage 
                      : `url(${slide.backgroundImage})` 
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/40 flex items-center">
                    <div className="container mx-auto px-4 md:px-8">
                      <div className="max-w-2xl pt-0 sm:pt-0 md:pt-0 lg:pt-0">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 leading-tight">
                          {slide.title}
                        </h1>
                        <p className="text-white/90 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 max-w-md">
                          {slide.description}
                        </p>
                        <Button 
                          className="px-4 py-2 sm:px-6 sm:py-4 md:px-8 md:py-6 text-sm sm:text-base md:text-lg bg-primary hover:bg-primary/90"
                          onClick={() => setLocation(slide.buttonLink)}
                        >
                          {slide.buttonText}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation buttons - only show if more than one slide */}
      {slidesToUse.length > 1 && (
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