import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type HeroImage = {
  filename: string;
  url: string;
};

export function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Fetch hero slider images
  const { data: heroImages = [] } = useQuery<HeroImage[]>({
    queryKey: ['/api/herosliders'],
    queryFn: () => apiRequest('GET', '/api/herosliders')
      .then(res => res.json()),
  });
  
  // Reset current index when images change
  useEffect(() => {
    if (heroImages.length > 0 && currentIndex >= heroImages.length) {
      setCurrentIndex(0);
    }
  }, [heroImages, currentIndex]);
  
  // Auto-advance slides every 5 seconds
  useEffect(() => {
    if (heroImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % heroImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [heroImages.length]);
  
  const goToPrevSlide = () => {
    setCurrentIndex(prev => 
      prev === 0 ? heroImages.length - 1 : prev - 1
    );
  };
  
  const goToNextSlide = () => {
    setCurrentIndex(prev => 
      (prev + 1) % heroImages.length
    );
  };
  
  // If no images, don't render anything
  if (heroImages.length === 0) {
    return null;
  }
  
  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      {/* Hero image slider */}
      <div className="relative w-full h-[300px] md:h-[450px]">
        {heroImages.map((image, index) => (
          <div
            key={image.filename}
            className={`absolute top-0 left-0 w-full h-full transition-opacity duration-500 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={image.url}
              alt="Hero banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ))}
      </div>
      
      {/* Navigation buttons (only if more than one image) */}
      {heroImages.length > 1 && (
        <>
          <button
            onClick={goToPrevSlide}
            className="absolute top-1/2 left-4 z-20 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNextSlide}
            className="absolute top-1/2 right-4 z-20 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {/* Indicator dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}