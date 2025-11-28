import { Link } from "wouter";
import { 
  Mail, 
  Phone, 
  Globe, 
  Shield, 
  HelpCircle,
  FileText,
  AlertTriangle,
  Heart,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ProfessionalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-foreground">
              <span className="text-primary">King</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-primary">Games</span>
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Experience the thrill of betting with our secure and fair gaming platform.
              We provide a premium betting experience with real-time results and attractive payouts.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                <Globe className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Column 2: Contact Us */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-foreground">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                  onClick={() => window.open('https://wa.me/6282264973815', '_blank')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center space-x-2 mb-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span>+62 822-6497-3815</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <a href="mailto:support@kinggames.vip" className="hover:text-primary transition-colors">
                    support@kinggames.vip
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/dashboard"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/games"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Games
                </Link>
              </li>
              <li>
                <Link 
                  href="/game-history"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Game History
                </Link>
              </li>
              <li>
                <Link 
                  href="/markets"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Markets
                </Link>
              </li>
              <li>
                <Link 
                  href="/auth"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm"
                >
                  Login/Register
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Column 3: Support */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-foreground">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/auth"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  href="/auth"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/auth"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Responsible Gaming
                </Link>
              </li>
              <li>
                <Link 
                  href="/auth"
                  className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </Link>
              </li>
            </ul>
          </div>
          

        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {currentYear} <span className="text-primary">King</span><span className="text-purple-400">Games</span>. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link 
              href="/auth"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link 
              href="/auth"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/auth"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
        
        {/* Made with love */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center">
            Made with <Heart className="h-3 w-3 mx-1 text-red-500" /> by <span className="text-primary ml-1">King</span><span className="text-purple-400">Games</span> Team
          </p>
        </div>
      </div>
    </footer>
  );
}
