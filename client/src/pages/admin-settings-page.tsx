import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Upload, X, Info, Trash2, RefreshCw } from "lucide-react";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("payment");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment Settings
  const [upiId, setUpiId] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  
  // Slider Images State
  const [sliderImages, setSliderImages] = useState<{filename: string, url: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Hero Slider Images State
  const [heroImages, setHeroImages] = useState<{id: number, filename: string, url: string, position: number}[]>([]);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const homeHeroFileInputRef = useRef<HTMLInputElement>(null);
  
  // Game Card Images State
  const [gameCardImages, setGameCardImages] = useState<{filename: string, url: string, gameType?: string}[]>([]);
  const [selectedGameImages, setSelectedGameImages] = useState<{[key: string]: string}>({
    market: '',
    cricket: '',
    sports: '',
    coinflip: ''
  });
  const [isUploadingGameCard, setIsUploadingGameCard] = useState<{[key: string]: boolean}>({
    market: false,
    cricket: false,
    sports: false,
    coinflip: false
  });
  const gameCardFileInputRefs = {
    market: useRef<HTMLInputElement>(null),
    cricket: useRef<HTMLInputElement>(null),
    sports: useRef<HTMLInputElement>(null),
    coinflip: useRef<HTMLInputElement>(null)
  };

  // Game Odds Settings
  const [coinFlipOdds, setCoinFlipOdds] = useState("1.95");
  const [cricketTossOdds, setCricketTossOdds] = useState("1.90");
  // Team Match odds removed
  const [satamatkaOdds, setSatamatkaOdds] = useState({
    jodi: "90.00",
    harf: "9.00",
    crossing: "95.00",
    odd_even: "1.90",
  });

  // Platform Default Subadmin Commission Setting (for fund transfers only)
  const [defaultCommissionRate, setDefaultCommissionRate] = useState("10.0");
  
  // Query to fetch default commission rates
  const { isLoading: isLoadingDefaultCommissions, data: defaultCommissionData } = useQuery({
    queryKey: ['/api/commissions/default'],
    queryFn: () => fetch('/api/commissions/default', {
      credentials: 'include'
    }).then(res => res.json())
  });
  
  // Update commission rate when default data is loaded
  useEffect(() => {
    if (defaultCommissionData && defaultCommissionData.deposit) {
      setDefaultCommissionRate(defaultCommissionData.deposit.toString());
    }
  }, [defaultCommissionData]);

  // Load payment settings
  const { data: paymentSettings, isLoading: isLoadingPayment } = useQuery<any[]>({
    queryKey: ['/api/settings', 'payment'],
    queryFn: () => apiRequest("GET", '/api/settings?type=payment')
      .then(res => res.json()),
  });
  
  // Load game image settings
  const { data: gameImageSettings } = useQuery<any[]>({
    queryKey: ['/api/settings', 'game_images'],
    queryFn: () => apiRequest("GET", '/api/settings?type=game_images')
      .then(res => res.json()),
  });

  // Process payment settings when they load
  useEffect(() => {
    if (paymentSettings) {
      paymentSettings.forEach((setting: any) => {
        switch (setting.settingKey) {
          case 'upi_id':
            setUpiId(setting.settingValue);
            break;
          case 'bank_name':
            setBankName(setting.settingValue);
            break;
          case 'account_number':
            setAccountNumber(setting.settingValue);
            break;
          case 'account_name':
            setAccountName(setting.settingValue);
            break;
          case 'ifsc_code':
            setIfscCode(setting.settingValue);
            break;
        }
      });
    }
  }, [paymentSettings]);

  // Load game odds
  const { data: coinFlipOddsData, isLoading: isLoadingOdds } = useQuery<any[]>({
    queryKey: ['/api/game-odds', 'coin_flip'],
    queryFn: () => apiRequest("GET", '/api/game-odds?gameType=coin_flip')
      .then(res => res.json()),
  });

  // Load cricket toss odds
  const { data: cricketTossOddsData } = useQuery<any[]>({
    queryKey: ['/api/game-odds', 'cricket_toss'],
    queryFn: () => apiRequest("GET", '/api/game-odds?gameType=cricket_toss')
      .then(res => res.json()),
  });

  // Team match odds queries removed

  // Process coin flip odds when they load
  useEffect(() => {
    if (coinFlipOddsData && coinFlipOddsData.length > 0) {
      // Convert the stored value (multiplied by 10000) back to a decimal for display
      const displayValue = (coinFlipOddsData[0].oddValue / 10000).toFixed(2);
      setCoinFlipOdds(displayValue);
    }
  }, [coinFlipOddsData]);
  
  // Process cricket toss odds when they load
  useEffect(() => {
    if (cricketTossOddsData && cricketTossOddsData.length > 0) {
      // Convert the stored value (multiplied by 10000) back to a decimal for display
      const displayValue = (cricketTossOddsData[0].oddValue / 10000).toFixed(2);
      setCricketTossOdds(displayValue);
    }
  }, [cricketTossOddsData]);
  
  // Team match odds processing removed

  // Load satamatka odds
  const { data: satamatkaOddsData } = useQuery<any>({
    queryKey: ['/api/game-odds', 'satamatka'],
    queryFn: async () => {
      const modes = ['jodi', 'harf', 'crossing', 'odd_even'];
      const results = await Promise.all(
        modes.map(mode => 
          apiRequest("GET", `/api/game-odds?gameType=satamatka_${mode}`)
            .then(res => res.json())
        )
      );
      
      return { 
        jodi: results[0], 
        harf: results[1], 
        crossing: results[2],
        odd_even: results[3] 
      };
    },
  });

  // Process satamatka odds when they load
  useEffect(() => {
    if (satamatkaOddsData) {
      const updatedOdds = { ...satamatkaOdds };
      
      if (satamatkaOddsData.jodi && satamatkaOddsData.jodi.length > 0) {
        // Convert the stored value (multiplied by 10000) back to a decimal for display
        updatedOdds.jodi = (satamatkaOddsData.jodi[0].oddValue / 10000).toFixed(2);
      }
      
      if (satamatkaOddsData.harf && satamatkaOddsData.harf.length > 0) {
        // Convert the stored value (multiplied by 10000) back to a decimal for display
        updatedOdds.harf = (satamatkaOddsData.harf[0].oddValue / 10000).toFixed(2);
      }
      
      if (satamatkaOddsData.crossing && satamatkaOddsData.crossing.length > 0) {
        // Convert the stored value (multiplied by 10000) back to a decimal for display
        updatedOdds.crossing = (satamatkaOddsData.crossing[0].oddValue / 10000).toFixed(2);
      }
      
      if (satamatkaOddsData.odd_even && satamatkaOddsData.odd_even.length > 0) {
        // Convert the stored value (multiplied by 10000) back to a decimal for display
        updatedOdds.odd_even = (satamatkaOddsData.odd_even[0].oddValue / 10000).toFixed(2);
      }
      
      setSatamatkaOdds(updatedOdds);
    }
  }, [satamatkaOddsData]);
  
  // Load slider images
  const { 
    data: sliderImagesData, 
    isLoading: isLoadingSliderImages,
    refetch: refetchSliderImages
  } = useQuery<{filename: string, url: string}[]>({
    queryKey: ['/api/sliders'],
    queryFn: () => apiRequest("GET", '/api/sliders')
      .then(res => res.json()),
  });
  
  // Load hero slider images
  const {
    data: heroImagesData,
    isLoading: isLoadingHeroImages,
    refetch: refetchHeroImages
  } = useQuery<{id: number, filename: string, url: string, position: number}[]>({
    queryKey: ['/api/herosliders'],
    queryFn: () => apiRequest("GET", '/api/herosliders')
      .then(res => res.json())
      .catch(() => []), // Return empty array if API endpoint doesn't exist yet
  });
  
  // Update slider images when data is loaded
  useEffect(() => {
    if (sliderImagesData) {
      setSliderImages(sliderImagesData);
    }
  }, [sliderImagesData]);
  
  // Update hero images when data is loaded
  useEffect(() => {
    if (heroImagesData) {
      // Sort by position to ensure display order
      const sortedImages = [...heroImagesData].sort((a, b) => a.position - b.position);
      setHeroImages(sortedImages);
    }
  }, [heroImagesData]);
  
  // Load game card images
  const { 
    data: gameCardImagesData, 
    isLoading: isLoadingGameCardImages,
    refetch: refetchGameCardImages
  } = useQuery<{filename: string, url: string}[]>({
    queryKey: ['/api/gamecards'],
    queryFn: () => apiRequest("GET", '/api/gamecards')
      .then(res => res.json()),
  });
  
  // Update game card images when data is loaded
  useEffect(() => {
    if (gameCardImagesData) {
      console.log('Received game card images from server:', gameCardImagesData);
      
      // The server now includes gameType directly in the API response
      setGameCardImages(gameCardImagesData);
    }
  }, [gameCardImagesData]);
  
  // Process game image settings when they load
  useEffect(() => {
    if (gameImageSettings && gameImageSettings.length > 0) {
      // Create a temporary object to hold selected images
      const selectedImgs: {[key: string]: string} = {
        market: '',
        cricket: '',
        sports: '',
        coinflip: ''
      };
      
      // Update selected images based on settings
      gameImageSettings.forEach((setting: any) => {
        const gameType = setting.settingKey.replace('primary_', '');
        if (selectedImgs.hasOwnProperty(gameType)) {
          selectedImgs[gameType] = setting.settingValue;
        }
      });
      
      // Update state with selected images
      setSelectedGameImages(selectedImgs);
    }
  }, [gameImageSettings]);
  
  // Upload slider image mutation
  const uploadSliderMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/upload/slider', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Image Uploaded",
        description: "Slider image has been uploaded successfully.",
      });
      refetchSliderImages();
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  });
  
  // Delete slider image mutation
  const deleteSliderMutation = useMutation({
    mutationFn: (filename: string) => 
      apiRequest("DELETE", `/api/sliders/${filename}`)
        .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Image Deleted",
        description: "Slider image has been deleted successfully.",
      });
      refetchSliderImages();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Upload QR code mutation
  const uploadQrMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/upload/qr-code', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to upload QR code';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setQrCodeUrl(data.imageUrl);
      setIsUploadingQr(false);
      toast({
        title: "QR Code Uploaded",
        description: "UPI QR code has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      setIsUploadingQr(false);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Upload hero image mutation
  const uploadHeroMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/upload/heroslider', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to upload hero image';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse JSON, use the response text if available
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hero Image Uploaded",
        description: "Home page hero image has been uploaded successfully.",
      });
      refetchHeroImages();
      setIsUploadingHero(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploadingHero(false);
    }
  });
  
  // Delete hero image mutation
  const deleteHeroMutation = useMutation({
    mutationFn: (filename: string) => 
      apiRequest("DELETE", `/api/herosliders/${filename}`)
        .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Hero Image Deleted",
        description: "Home page hero image has been deleted successfully.",
      });
      refetchHeroImages();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update hero image position mutation
  const updateHeroPositionMutation = useMutation({
    mutationFn: ({ imageId, newPosition }: { imageId: number, newPosition: number }) => 
      apiRequest("PATCH", `/api/herosliders/${imageId}/position`, { position: newPosition })
        .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Position Updated",
        description: "Hero image position has been updated successfully.",
      });
      refetchHeroImages();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (settings: any) => apiRequest("POST", '/api/settings', settings)
      .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Settings",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save game odds mutation
  const saveOddsMutation = useMutation({
    mutationFn: (odds: any) => apiRequest("POST", '/api/game-odds', odds)
      .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Game Odds Saved",
        description: "Your game odds have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/game-odds'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Game Odds",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save commission mutation
  const saveCommissionMutation = useMutation({
    mutationFn: (commission: any) => apiRequest("POST", '/api/commissions/default', commission)
      .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Commission Rates Saved",
        description: "Platform default commission rates have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/commissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/commissions/default'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Commission Rates",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Additional mutation to update wallet payment details
  const saveWalletPaymentDetailsMutation = useMutation({
    mutationFn: (details: any) => apiRequest("PUT", '/api/wallet/payment-details', details)
      .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Payment Details Saved",
        description: "Payment details have been updated for wallet deposits.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/payment-details'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Saving Payment Details",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle payment settings save
  const handleSavePayment = () => {
    // Save individual settings
    // Save UPI ID
    saveMutation.mutate({ 
      settingType: "payment", 
      settingKey: "upi_id", 
      settingValue: upiId 
    });
    
    // Save Bank Details
    saveMutation.mutate({ 
      settingType: "payment", 
      settingKey: "bank_name", 
      settingValue: bankName 
    });
    
    saveMutation.mutate({ 
      settingType: "payment", 
      settingKey: "account_number", 
      settingValue: accountNumber 
    });
    
    saveMutation.mutate({ 
      settingType: "payment", 
      settingKey: "account_name", 
      settingValue: accountName 
    });
    
    saveMutation.mutate({ 
      settingType: "payment", 
      settingKey: "ifsc_code", 
      settingValue: ifscCode 
    });
    
    // IMPORTANT: Also update the wallet payment details for the client interface
    saveWalletPaymentDetailsMutation.mutate({
      upi: {
        id: upiId,
        qrCode: qrCodeUrl || null
      },
      bank: {
        name: bankName,
        accountNumber: accountNumber,
        ifscCode: ifscCode,
        accountHolder: accountName
      }
    });
  };

  // Handle game odds save
  const handleSaveGameOdds = () => {
    // Save Coin Flip odds
    // Don't multiply by 10000 again since we already did it in the input onChange handler
    saveOddsMutation.mutate({
      gameType: "coin_flip",
      oddValue: Number(coinFlipOdds),
      setByAdmin: true
    });
    
    // Save Cricket Toss odds
    saveOddsMutation.mutate({
      gameType: "cricket_toss",
      oddValue: Number(cricketTossOdds),
      setByAdmin: true
    });
    
    // Team match odds saving removed
    
    // Save Satamatka odds
    saveOddsMutation.mutate({
      gameType: "satamatka_jodi",
      oddValue: Number(satamatkaOdds.jodi),
      setByAdmin: true
    });
    
    saveOddsMutation.mutate({
      gameType: "satamatka_harf",
      oddValue: Number(satamatkaOdds.harf),
      setByAdmin: true
    });
    
    saveOddsMutation.mutate({
      gameType: "satamatka_crossing",
      oddValue: Number(satamatkaOdds.crossing),
      setByAdmin: true
    });
    
    saveOddsMutation.mutate({
      gameType: "satamatka_odd_even",
      oddValue: Number(satamatkaOdds.odd_even),
      setByAdmin: true
    });
  };
  
  // Handle slider image upload
  const handleSliderImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('sliderImage', file);
    
    setIsUploading(true);
    uploadSliderMutation.mutate(formData);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle slider image delete
  const handleDeleteSliderImage = (filename: string) => {
    if (confirm('Are you sure you want to delete this slider image?')) {
      deleteSliderMutation.mutate(filename);
    }
  };
  
  // Handle hero image upload
  const handleHeroImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('heroSliderImage', file);
    
    setIsUploadingHero(true);
    uploadHeroMutation.mutate(formData);
    
    // Reset the file input
    if (homeHeroFileInputRef.current) {
      homeHeroFileInputRef.current.value = '';
    }
  };
  
  // Handle hero image delete
  const handleDeleteHeroImage = (filename: string) => {
    if (confirm('Are you sure you want to delete this hero image?')) {
      deleteHeroMutation.mutate(filename);
    }
  };
  
  // Handle changing hero image position
  const handleMoveHeroImage = (imageId: number, direction: 'up' | 'down') => {
    const currentIndex = heroImages.findIndex(img => img.id === imageId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= heroImages.length) return;
    
    // Update positions in API
    updateHeroPositionMutation.mutate({
      imageId: imageId,
      newPosition: heroImages[newIndex].position
    });
  };
  
  // Upload game card image mutation
  const uploadGameCardMutation = useMutation({
    mutationFn: async ({ formData, gameType }: { formData: FormData; gameType: string }) => {
      const response = await fetch('/api/upload/gamecard', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      return { 
        result: await response.json(),
        gameType
      };
    },
    onSuccess: (data) => {
      const { gameType, result } = data;
      
      console.log("Upload success response:", result);
      
      // Immediately add the newly uploaded image to the state with the correct game type
      if (result && result.imageUrl) {
        const newImage = {
          filename: result.filename,
          url: result.imageUrl,
          gameType: result.gameType || gameType
        };
        
        console.log("Adding new image to state:", newImage);
        
        // Add the new image to the state
        setGameCardImages(prevImages => {
          const newImages = [...prevImages, newImage];
          console.log("Updated images state:", newImages);
          return newImages;
        });
      }
      
      toast({
        title: "Image Uploaded",
        description: `Game card image for ${gameType.toUpperCase()} has been uploaded successfully.`,
      });
      
      // No longer need to refetch - we already have the correct state
      // refetchGameCardImages();
      
      setIsUploadingGameCard(prev => ({
        ...prev,
        [data.gameType]: false
      }));
    },
    onError: (error: Error, variables) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploadingGameCard(prev => ({
        ...prev,
        [variables.gameType]: false
      }));
    }
  });
  
  // Delete game card image mutation
  const deleteGameCardMutation = useMutation({
    mutationFn: (filename: string) => 
      apiRequest("DELETE", `/api/gamecards/${filename}`)
        .then(res => res.json()),
    onSuccess: () => {
      toast({
        title: "Image Deleted",
        description: "Game card image has been deleted successfully.",
      });
      refetchGameCardImages();
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle selecting a game card image as primary
  const handleSelectGameImage = (filename: string, gameType: string) => {
    // Update the selected image for this game type
    setSelectedGameImages(prev => ({
      ...prev,
      [gameType]: filename
    }));
    
    // Save this selection to the database
    saveMutation.mutate({
      settingType: "game_images",
      settingKey: `primary_${gameType}`,
      settingValue: filename
    });
    
    toast({
      title: "Primary Image Selected",
      description: `This image will now be used as the primary image for ${gameType.toUpperCase()} games.`,
    });
  };
  
  // Handler for retrieving the selected status of an image
  const isSelectedImage = (filename: string, gameType: string) => {
    return selectedGameImages[gameType] === filename;
  };

  // Handle QR code upload
  const handleQrUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('qrImage', file);
    
    setIsUploadingQr(true);
    uploadQrMutation.mutate(formData);
  };

  // Handle game card image upload
  const handleGameCardImageUpload = (event: React.ChangeEvent<HTMLInputElement>, gameType: string) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('gameCardImage', file);
    // Ensure we use exact game type strings that match the server-side processing
    formData.append('gameType', gameType);
    
    console.log(`Uploading ${gameType} game card image:`, file.name);
    
    setIsUploadingGameCard(prev => ({
      ...prev,
      [gameType]: true
    }));
    
    uploadGameCardMutation.mutate({ formData, gameType });
    
    // Reset the file input
    if (gameCardFileInputRefs[gameType as keyof typeof gameCardFileInputRefs]?.current) {
      gameCardFileInputRefs[gameType as keyof typeof gameCardFileInputRefs].current!.value = '';
    }
  };
  
  // Handle game card image delete
  const handleDeleteGameCardImage = (filename: string) => {
    if (confirm('Are you sure you want to delete this game card image?')) {
      deleteGameCardMutation.mutate(filename);
    }
  };

  return (
    <DashboardLayout title="Admin Settings">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        {/* Mobile view: scrollable tabs */}
        <div className="md:hidden mb-6">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
            <TabsList className="inline-flex flex-nowrap min-w-max h-12 p-1 gap-1">
              <TabsTrigger value="payment" className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm">
                Payment
              </TabsTrigger>
              <TabsTrigger value="odds" className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm">
                Game Odds
              </TabsTrigger>
              <TabsTrigger value="commission" className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm">
                Commission
              </TabsTrigger>
              <TabsTrigger value="slider" className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm">
                Sliders
              </TabsTrigger>
              <TabsTrigger value="gamecards" className="flex-shrink-0 whitespace-nowrap px-3 py-2 text-sm">
                Game Cards
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Swipe to see more options →
          </div>
        </div>

        {/* Desktop view: grid tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="payment">Payment Settings</TabsTrigger>
            <TabsTrigger value="odds">Platform Game Odds</TabsTrigger>
            <TabsTrigger value="commission">Subadmin Commission</TabsTrigger>
            <TabsTrigger value="slider">Sliders</TabsTrigger>
            <TabsTrigger value="gamecards">Game Cards</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Payment Settings Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Configure payment methods that users will use to deposit funds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingPayment ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">UPI Payment</h3>
                      <Separator className="my-2" />
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="upiId">UPI IDs (One per line)</Label>
                          <textarea 
                            id="upiId" 
                            value={upiId} 
                            onChange={(e) => setUpiId(e.target.value)} 
                            placeholder="username@ybl&#10;company@paytm&#10;business@gpay"
                            className="w-full p-3 border rounded-md bg-background text-foreground min-h-[100px] resize-vertical"
                            rows={4}
                          />
                          <p className="text-sm text-muted-foreground">
                            Enter multiple UPI IDs, one per line. Users will see these options when making deposits.
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>UPI QR Code (Optional)</Label>
                          <div className="flex items-center gap-4">
                            <Button
                              onClick={() => qrFileInputRef.current?.click()}
                              className="gap-2"
                              disabled={isUploadingQr}
                              variant="outline"
                            >
                              {isUploadingQr ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Upload QR Code
                            </Button>
                            <input
                              type="file"
                              ref={qrFileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleQrUpload}
                            />
                            {qrCodeUrl && (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={qrCodeUrl} 
                                  alt="UPI QR Code" 
                                  className="w-16 h-16 border rounded object-cover"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setQrCodeUrl("")}
                                >
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Upload a QR code image that users can scan to make UPI payments quickly.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Bank Transfer</h3>
                      <Separator className="my-2" />
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input 
                            id="bankName" 
                            value={bankName} 
                            onChange={(e) => setBankName(e.target.value)} 
                            placeholder="Bank Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountName">Account Holder Name</Label>
                          <Input 
                            id="accountName" 
                            value={accountName} 
                            onChange={(e) => setAccountName(e.target.value)} 
                            placeholder="Account Holder Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number</Label>
                          <Input 
                            id="accountNumber" 
                            value={accountNumber} 
                            onChange={(e) => setAccountNumber(e.target.value)} 
                            placeholder="Account Number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ifscCode">IFSC Code</Label>
                          <Input 
                            id="ifscCode" 
                            value={ifscCode} 
                            onChange={(e) => setIfscCode(e.target.value)} 
                            placeholder="IFSC Code"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSavePayment} 
                disabled={isLoadingPayment || saveMutation.isPending}
              >
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Payment Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Platform Game Odds Tab */}
        <TabsContent value="odds">
          <Card>
            <CardHeader>
              <CardTitle>Platform Game Odds Settings</CardTitle>
              <CardDescription>
                Configure the default odds multipliers for the entire platform. These settings serve as the base odds for all games across the platform. To set individual odds for specific subadmins, visit the Subadmin Management page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingOdds ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="bg-blue-950/40 p-4 rounded-lg border border-blue-800 mb-6">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-400">Platform-Wide Default Odds</h3>
                          <p className="text-sm text-slate-300 mt-1">
                            These odds settings serve as the default for the entire platform and will apply to all subadmins
                            unless they have custom odds configured. To set custom odds for specific subadmins, 
                            please visit the Subadmin Management page.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Royal Toss Game</h3>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        <Label htmlFor="coinFlipOdds">Win Multiplier</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="coinFlipOdds" 
                            value={Number(coinFlipOdds)} 
                            onChange={(e) => setCoinFlipOdds(e.target.value)} 
                            placeholder="1.95"
                            type="number"
                            step="0.01"
                            className="max-w-[120px]"
                          />
                          <span>times the bet amount</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Cricket Toss Game</h3>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        <Label htmlFor="cricketTossOdds">Win Multiplier</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="cricketTossOdds" 
                            value={Number(cricketTossOdds)} 
                            onChange={(e) => setCricketTossOdds(e.target.value)} 
                            placeholder="1.90"
                            type="number"
                            step="0.01"
                            className="max-w-[120px]"
                          />
                          <span>times the bet amount</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {/* Team Match Game section removed */}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Satamatka</h3>
                      <Separator className="my-2" />
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                          <Label htmlFor="satamatka-jodi">Jodi (00-99)</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              id="satamatka-jodi" 
                              value={Number(satamatkaOdds.jodi)} 
                              onChange={(e) => setSatamatkaOdds({...satamatkaOdds, jodi: e.target.value})} 
                              placeholder="90"
                              type="number"
                              step="0.01"
                              className="max-w-[120px]"
                            />
                            <span>×</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="satamatka-harf">Harf</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              id="satamatka-harf" 
                              value={Number(satamatkaOdds.harf)} 
                              onChange={(e) => setSatamatkaOdds({...satamatkaOdds, harf: e.target.value})} 
                              placeholder="9"
                              type="number"
                              step="0.01"
                              className="max-w-[120px]"
                            />
                            <span>×</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="satamatka-crossing">Crossing</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              id="satamatka-crossing" 
                              value={Number(satamatkaOdds.crossing)} 
                              onChange={(e) => setSatamatkaOdds({...satamatkaOdds, crossing: e.target.value})} 
                              placeholder="95"
                              type="number"
                              step="0.01"
                              className="max-w-[120px]"
                            />
                            <span>×</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="satamatka-odd-even">Odd-Even</Label>
                          <div className="flex items-center gap-2">
                            <Input 
                              id="satamatka-odd-even" 
                              value={Number(satamatkaOdds.odd_even)} 
                              onChange={(e) => setSatamatkaOdds({...satamatkaOdds, odd_even: e.target.value})} 
                              placeholder="1.9"
                              type="number"
                              step="0.01"
                              className="max-w-[120px]"
                            />
                            <span>×</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveGameOdds} 
                disabled={isLoadingOdds || saveOddsMutation.isPending}
              >
                {saveOddsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Platform Game Odds
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Commission Tab */}
        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle>Platform Default Commission</CardTitle>
              <CardDescription>
                Set the default commission percentage that applies to all subadmins
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-950/40 p-4 rounded-lg border border-blue-800 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-400">Platform-Wide Default Commission Rates</h3>
                      <p className="text-sm text-slate-300 mt-1">
                        These commission settings serve as the default for the entire platform. To set individual commission rates 
                        for specific subadmins, please visit the Subadmin Management page.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Platform Default Commission */}
                  <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium">Default Subadmin Commission</h3>
                        <p className="text-sm text-slate-400 mt-1">
                          This is the default commission rate that applies to all subadmins on the platform.
                          Individual rates can be set in the Subadmin Management section.
                        </p>
                        <Separator className="my-4" />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor="commission-deposit" className="text-base">
                              Default Subadmin Commission Rate
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input 
                                id="commission-deposit" 
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={defaultCommissionRate} 
                                onChange={(e) => setDefaultCommissionRate(e.target.value)} 
                                placeholder="0.0"
                                className="max-w-[120px]"
                              />
                              <span>% of transaction amount</span>
                            </div>
                            <p className="text-sm text-slate-400">
                              This rate applies to all admin-subadmin fund transfers where a specific commission rate 
                              has not been set for the subadmin. You can set any value from 0% to 100%.
                            </p>
                          </div>
                          
                          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-700 min-w-[280px]">
                            <h4 className="text-sm font-medium text-primary mb-3">Deposit Example</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Subadmin will receive:</span>
                                <span className="font-medium">₹10,000</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Commission ({defaultCommissionRate}%):</span>
                                <span>₹{(10000 * parseFloat(defaultCommissionRate || "0") / 100).toFixed(2)}</span>
                              </div>
                              <Separator className="my-1" />
                              <div className="flex justify-between font-medium text-orange-400">
                                <span>Admin pays total:</span>
                                <span>₹{(10000 + 10000 * parseFloat(defaultCommissionRate || "0") / 100).toFixed(2)}</span>
                              </div>
                            </div>
                            
                            <Separator className="my-3" />
                            
                            <h4 className="text-sm font-medium text-primary mb-3">Withdrawal Example</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Subadmin withdraws:</span>
                                <span className="font-medium">₹5,000</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Commission ({defaultCommissionRate}%):</span>
                                <span>₹{(5000 * parseFloat(defaultCommissionRate || "0") / 100).toFixed(2)}</span>
                              </div>
                              <Separator className="my-1" />
                              <div className="flex justify-between font-medium text-green-400">
                                <span>Admin receives total:</span>
                                <span>₹{(5000 + 5000 * parseFloat(defaultCommissionRate || "0") / 100).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-950/40 p-4 rounded-lg border border-blue-800">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-blue-400">About Commission Settings</h3>
                        <p className="text-sm text-slate-300 mt-1">
                          You can set any commission rate from 0% to 100%. This platform-wide setting will apply to all 
                          subadmins that don't have individual rates configured. For individual subadmin commission rates, 
                          please visit the Subadmin Management page.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => {
                  // Save platform-wide default commission rate for fund transfers
                  saveCommissionMutation.mutate({
                    defaultRates: {
                      deposit: Math.round(parseFloat(defaultCommissionRate) * 100)
                    }
                  });
                }}
                disabled={saveCommissionMutation.isPending}
              >
                {saveCommissionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Commission Rate
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Slider Settings Tab */}
        <TabsContent value="slider">
          <Card>
            <CardHeader>
              <CardTitle>Platform Slider Management</CardTitle>
              <CardDescription>
                Manage slider images for both public home page and logged-in users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSliderImages ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Public Home Page Hero Slider Section */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Public Home Page Hero Slider</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Manage slider images that appear on the public home page visible to all visitors
                    </p>
                    
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-400">Home Page Hero Requirements</h3>
                          <p className="text-sm text-slate-400 mt-1">
                            For best results, upload images with a 16:9 aspect ratio (e.g., 1920×1080 pixels).
                            Images should be less than 2MB in size and in JPG, PNG, or WebP format.
                            These images will be displayed prominently on the public home page.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => homeHeroFileInputRef.current?.click()}
                          className="gap-2"
                          disabled={isUploadingHero}
                        >
                          {isUploadingHero ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Upload Hero Image
                        </Button>
                        <input
                          type="file"
                          ref={homeHeroFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleHeroImageUpload}
                        />
                        
                        <Button
                          variant="outline"
                          onClick={() => refetchHeroImages()}
                          size="icon"
                          title="Refresh hero slider images"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {heroImages.length === 0 ? (
                        <div className="py-8 px-4 text-center bg-slate-800/30 border border-dashed border-slate-700 rounded-lg">
                          <p className="text-slate-400">No hero slider images uploaded yet. Upload some images to display on the public home page.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {heroImages.map((image) => (
                            <div 
                              key={image.filename} 
                              className="relative group overflow-hidden rounded-lg border border-slate-700"
                            >
                              <img 
                                src={image.url} 
                                alt={`Hero slider image ${image.filename}`}
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleDeleteHeroImage(image.filename)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-2 truncate">
                                {image.filename}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Dashboard Promo Slider Section */}
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Dashboard Promo Slider</h3>
                    <p className="text-sm text-slate-400 mb-4">
                      Manage promotional slider images shown to logged-in users on their dashboard
                    </p>
                    
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-400">Promo Slider Requirements</h3>
                          <p className="text-sm text-slate-400 mt-1">
                            For best results, upload images with a 4:1 aspect ratio (e.g., 1200×300 pixels).
                            Images should be less than 2MB in size and in JPG, PNG, or WebP format.
                            Images will be displayed at a height of 180px on all devices, with responsive width.
                          </p>
                        </div>
                      </div>
                    </div>
                  
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2"
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Upload Promo Image
                        </Button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleSliderImageUpload}
                        />
                        
                        <Button
                          variant="outline"
                          onClick={() => refetchSliderImages()}
                          size="icon"
                          title="Refresh slider images"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {sliderImages.length === 0 ? (
                        <div className="py-8 px-4 text-center bg-slate-800/30 border border-dashed border-slate-700 rounded-lg">
                          <p className="text-slate-400">No promo slider images uploaded yet. Upload some images to display in the dashboard promotional slider.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sliderImages.map((image) => (
                            <div 
                              key={image.filename} 
                              className="relative group overflow-hidden rounded-lg border border-slate-700"
                            >
                              <img 
                                src={image.url} 
                                alt={`Slider image ${image.filename}`}
                                className="w-full h-40 object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleDeleteSliderImage(image.filename)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </Button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-xs p-2 truncate">
                                {image.filename}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-slate-800 pt-4">
              <div className="text-sm text-slate-400">
                Total Images: {sliderImages.length}
              </div>
              <div className="text-sm text-slate-400">
                Last Updated: {sliderImages.length > 0 ? new Date().toLocaleDateString() : 'Never'}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Game Cards Tab */}
        <TabsContent value="gamecards">
          <Card>
            <CardHeader>
              <CardTitle>Game Card Images</CardTitle>
              <CardDescription>
                Manage the game card images shown for each game type on the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingGameCardImages ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-400">Image Requirements</h3>
                          <p className="text-sm text-slate-400 mt-1">
                            For best results, upload images with a landscape aspect ratio (e.g., 800×450 pixels).
                            Images should be less than 2MB in size and in JPG, PNG, or WebP format.
                            Images will be displayed as background on game cards, so they should have good contrast with text overlay.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-4">
                      <Button
                        variant="outline"
                        onClick={() => refetchGameCardImages()}
                        size="icon"
                        title="Refresh game card images"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-8">
                      {/* Market Game Card Image Section */}
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-medium mb-4">Market Game Card Image</h3>
                        
                        <div className="flex flex-col gap-6">
                          <div className="flex items-center gap-4">
                            <Button
                              onClick={() => gameCardFileInputRefs.market.current?.click()}
                              className="gap-2"
                              disabled={isUploadingGameCard.market}
                            >
                              {isUploadingGameCard.market ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Upload Market Game Image
                            </Button>
                            <input
                              type="file"
                              ref={gameCardFileInputRefs.market}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleGameCardImageUpload(e, 'market')}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gameCardImages
                              .filter(img => img.gameType === 'market')
                              .map((image) => (
                                <div 
                                  key={image.filename} 
                                  className={`relative group overflow-hidden rounded-md border ${isSelectedImage(image.filename, 'market') ? 'border-green-500 ring-2 ring-green-500' : 'border-slate-700'}`}
                                >
                                  <img 
                                    src={image.url} 
                                    alt="Market Game Card" 
                                    className="object-cover w-full h-[160px]"
                                  />
                                  
                                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3">
                                    <div className="flex justify-between">
                                      {isSelectedImage(image.filename, 'market') && (
                                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                          Selected
                                        </div>
                                      )}
                                      
                                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8 rounded-full"
                                          onClick={() => handleDeleteGameCardImage(image.filename)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="text-white text-sm font-medium">
                                        Market Game
                                      </div>
                                      
                                      <Button
                                        size="sm"
                                        variant={isSelectedImage(image.filename, 'market') ? "secondary" : "outline"}
                                        className={`${isSelectedImage(image.filename, 'market') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-800/60 hover:bg-slate-700'}`}
                                        onClick={() => handleSelectGameImage(image.filename, 'market')}
                                      >
                                        {isSelectedImage(image.filename, 'market') ? 'Selected' : 'Select'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                            ))}
                            
                            {gameCardImages.filter(img => img.gameType === 'market').length === 0 && (
                              <div className="py-6 px-4 text-center bg-slate-800/30 border border-dashed border-slate-700 rounded-lg">
                                <p className="text-slate-400">No Market Game card image uploaded yet. Upload an image to use as background for the Market Game card.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Sports Exchange Card Image Section */}
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-medium mb-4">Sports Exchange Card Image</h3>
                        
                        <div className="flex flex-col gap-6">
                          <div className="flex items-center gap-4">
                            <Button
                              onClick={() => gameCardFileInputRefs.sports.current?.click()}
                              className="gap-2"
                              disabled={isUploadingGameCard.sports}
                            >
                              {isUploadingGameCard.sports ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Upload Sports Exchange Image
                            </Button>
                            <input
                              type="file"
                              ref={gameCardFileInputRefs.sports}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleGameCardImageUpload(e, 'sports')}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gameCardImages
                              .filter(img => img.gameType === 'sports')
                              .map((image) => (
                                <div 
                                  key={image.filename} 
                                  className={`relative group overflow-hidden rounded-md border ${isSelectedImage(image.filename, 'sports') ? 'border-green-500 ring-2 ring-green-500' : 'border-slate-700'}`}
                                >
                                  <img 
                                    src={image.url} 
                                    alt="Sports Exchange Card" 
                                    className="object-cover w-full h-[160px]"
                                  />
                                  
                                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3">
                                    <div className="flex justify-between">
                                      {isSelectedImage(image.filename, 'sports') && (
                                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                          Selected
                                        </div>
                                      )}
                                      
                                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8 rounded-full"
                                          onClick={() => handleDeleteGameCardImage(image.filename)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="text-white text-sm font-medium">
                                        Sports Exchange
                                      </div>
                                      
                                      <Button
                                        size="sm"
                                        variant={isSelectedImage(image.filename, 'sports') ? "secondary" : "outline"}
                                        className={`${isSelectedImage(image.filename, 'sports') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-800/60 hover:bg-slate-700'}`}
                                        onClick={() => handleSelectGameImage(image.filename, 'sports')}
                                      >
                                        {isSelectedImage(image.filename, 'sports') ? 'Selected' : 'Select'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                            ))}
                            
                            {gameCardImages.filter(img => img.gameType === 'sports').length === 0 && (
                              <div className="py-6 px-4 text-center bg-slate-800/30 border border-dashed border-slate-700 rounded-lg">
                                <p className="text-slate-400">No Sports Exchange card image uploaded yet. Upload an image to use as background for the Sports Exchange card.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Cricket Toss Card Image Section */}
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-medium mb-4">Cricket Toss Card Image</h3>
                        
                        <div className="flex flex-col gap-6">
                          <div className="flex items-center gap-4">
                            <Button
                              onClick={() => gameCardFileInputRefs.cricket.current?.click()}
                              className="gap-2"
                              disabled={isUploadingGameCard.cricket}
                            >
                              {isUploadingGameCard.cricket ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Upload Cricket Toss Image
                            </Button>
                            <input
                              type="file"
                              ref={gameCardFileInputRefs.cricket}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleGameCardImageUpload(e, 'cricket')}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gameCardImages
                              .filter(img => img.gameType === 'cricket')
                              .map((image) => (
                                <div 
                                  key={image.filename} 
                                  className={`relative group overflow-hidden rounded-md border ${isSelectedImage(image.filename, 'cricket') ? 'border-green-500 ring-2 ring-green-500' : 'border-slate-700'}`}
                                >
                                  <img 
                                    src={image.url} 
                                    alt="Cricket Toss Card" 
                                    className="object-cover w-full h-[160px]"
                                  />
                                  
                                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3">
                                    <div className="flex justify-between">
                                      {isSelectedImage(image.filename, 'cricket') && (
                                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                          Selected
                                        </div>
                                      )}
                                      
                                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8 rounded-full"
                                          onClick={() => handleDeleteGameCardImage(image.filename)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="text-white text-sm font-medium">
                                        Cricket Toss
                                      </div>
                                      
                                      <Button
                                        size="sm"
                                        variant={isSelectedImage(image.filename, 'cricket') ? "secondary" : "outline"}
                                        className={`${isSelectedImage(image.filename, 'cricket') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-800/60 hover:bg-slate-700'}`}
                                        onClick={() => handleSelectGameImage(image.filename, 'cricket')}
                                      >
                                        {isSelectedImage(image.filename, 'cricket') ? 'Selected' : 'Select'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                            ))}
                            
                            {gameCardImages.filter(img => img.gameType === 'cricket').length === 0 && (
                              <div className="py-6 px-4 text-center bg-slate-800/30 border border-dashed border-slate-700 rounded-lg">
                                <p className="text-slate-400">No Cricket Toss card image uploaded yet. Upload an image to use as background for the Cricket Toss card.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Coin Flip Card Image Section */}
                      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-medium mb-4">Coin Flip Card Image</h3>
                        
                        <div className="flex flex-col gap-6">
                          <div className="flex items-center gap-4">
                            <Button
                              onClick={() => gameCardFileInputRefs.coinflip.current?.click()}
                              className="gap-2"
                              disabled={isUploadingGameCard.coinflip}
                            >
                              {isUploadingGameCard.coinflip ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Upload Coin Flip Image
                            </Button>
                            <input
                              type="file"
                              ref={gameCardFileInputRefs.coinflip}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleGameCardImageUpload(e, 'coinflip')}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gameCardImages
                              .filter(img => img.gameType === 'coinflip')
                              .map((image) => (
                                <div 
                                  key={image.filename} 
                                  className={`relative group overflow-hidden rounded-md border ${isSelectedImage(image.filename, 'coinflip') ? 'border-green-500 ring-2 ring-green-500' : 'border-slate-700'}`}
                                >
                                  <img 
                                    src={image.url} 
                                    alt="Coin Flip Card" 
                                    className="object-cover w-full h-[160px]"
                                  />
                                  
                                  <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-3">
                                    <div className="flex justify-between">
                                      {isSelectedImage(image.filename, 'coinflip') && (
                                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                          Selected
                                        </div>
                                      )}
                                      
                                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                                        <Button
                                          variant="destructive"
                                          size="icon"
                                          className="h-8 w-8 rounded-full"
                                          onClick={() => handleDeleteGameCardImage(image.filename)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                      <div className="text-white text-sm font-medium">
                                        Coin Flip
                                      </div>
                                      
                                      <Button
                                        size="sm"
                                        variant={isSelectedImage(image.filename, 'coinflip') ? "secondary" : "outline"}
                                        className={`${isSelectedImage(image.filename, 'coinflip') ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-800/60 hover:bg-slate-700'}`}
                                        onClick={() => handleSelectGameImage(image.filename, 'coinflip')}
                                      >
                                        {isSelectedImage(image.filename, 'coinflip') ? 'Selected' : 'Select'}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                            ))}
                            
                            {gameCardImages.filter(img => img.gameType === 'coinflip').length === 0 && (
                              <div className="py-6 px-4 text-center bg-slate-800/30 border border-dashed border-slate-700 rounded-lg">
                                <p className="text-slate-400">No Coin Flip card image uploaded yet. Upload an image to use as background for the Coin Flip card.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}