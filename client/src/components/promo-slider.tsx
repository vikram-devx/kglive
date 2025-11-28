import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Fallback promo images in case no admin uploaded images are available
const fallbackPromoImages = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=300&q=80",
    alt: "Cricket Stadium - Special Offer Bonus"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1595604501726-7e1ba58e8c16?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=300&q=80",
    alt: "Cricket Match - Daily Cashback"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1600250624674-fb4969825db7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&h=300&q=80",
    alt: "Cricket Bat and Ball - VIP Rewards"
  }
];

export default function PromoSlider() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [promoImages, setPromoImages] = useState<{id: number, url: string, alt: string}[]>([]);
  
  // Fetch slider images from the API
  const { data: sliderImages, isLoading } = useQuery<{filename: string, url: string}[]>({
    queryKey: ['/api/sliders'],
    queryFn: () => apiRequest("GET", '/api/sliders')
      .then(res => res.json()),
  });
  
  // Process slider images or use fallback images if none are available
  useEffect(() => {
    if (sliderImages && sliderImages.length > 0) {
      // Convert the server images to the format expected by the slider
      const formattedImages = sliderImages.map((image, index) => ({
        id: index + 1,
        url: image.url,
        alt: `Promotional Slider ${index + 1}`
      }));
      setPromoImages(formattedImages);
    } else {
      // If no images are available from the server, use the fallback images
      setPromoImages(fallbackPromoImages);
    }
  }, [sliderImages]);
  
  // Auto-slide every 5 seconds
  useEffect(() => {
    if (promoImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === promoImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [promoImages]);
  
  const goToPrevious = () => {
    if (promoImages.length === 0) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? promoImages.length - 1 : prevIndex - 1
    );
  };
  
  const goToNext = () => {
    if (promoImages.length === 0) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === promoImages.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  // Loading state
  if (isLoading || promoImages.length === 0) {
    return (
      <Card className="w-full bg-slate-900/50 border-slate-800 overflow-hidden relative">
        <CardContent className="p-0 flex items-center justify-center h-[180px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-slate-900/50 border-slate-800 overflow-hidden relative">
      <CardContent className="p-0 relative">
        {/* Image container with transition */}
        <div className="relative overflow-hidden w-full h-[180px]">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
          >
            {promoImages.map((image) => (
              <div key={image.id} className="w-full h-full flex-shrink-0">
                <div className="relative w-full h-full">
                  <img 
                    src={image.url} 
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Navigation dots */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-2">
          {promoImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex ? "bg-white" : "bg-white/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}