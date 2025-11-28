import whatsappIcon from "@assets/whatsapp-chat.png";

export default function FloatingWhatsApp() {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/6282264973815', '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleWhatsAppClick}
        className="group relative bg-green-500 hover:bg-green-600 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-pulse"
        aria-label="Chat on WhatsApp"
      >
        <img 
          src={whatsappIcon} 
          alt="WhatsApp" 
          className="w-12 h-12 rounded-lg"
        />
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Chat with us on WhatsApp
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30"></div>
      </button>
    </div>
  );
}