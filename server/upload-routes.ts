import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { UserRole } from '@shared/schema';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const proofUploadsDir = path.join(uploadsDir, 'proofs');
const sliderUploadsDir = path.join(uploadsDir, 'sliders');
const heroSliderUploadsDir = path.join(uploadsDir, 'hero-sliders');
const gameCardUploadsDir = path.join(uploadsDir, 'gamecards');
const matchBannerUploadsDir = path.join(uploadsDir, 'match-banners');
const marketBannerUploadsDir = path.join(uploadsDir, 'market-banners');
const qrCodeUploadsDir = path.join(uploadsDir, 'qr-codes');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(proofUploadsDir)) {
  fs.mkdirSync(proofUploadsDir, { recursive: true });
}

if (!fs.existsSync(sliderUploadsDir)) {
  fs.mkdirSync(sliderUploadsDir, { recursive: true });
}

if (!fs.existsSync(heroSliderUploadsDir)) {
  fs.mkdirSync(heroSliderUploadsDir, { recursive: true });
}

if (!fs.existsSync(gameCardUploadsDir)) {
  fs.mkdirSync(gameCardUploadsDir, { recursive: true });
}

if (!fs.existsSync(matchBannerUploadsDir)) {
  fs.mkdirSync(matchBannerUploadsDir, { recursive: true });
}

if (!fs.existsSync(marketBannerUploadsDir)) {
  fs.mkdirSync(marketBannerUploadsDir, { recursive: true });
}

if (!fs.existsSync(qrCodeUploadsDir)) {
  fs.mkdirSync(qrCodeUploadsDir, { recursive: true });
}

// File filter to accept only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure proof uploads storage
const proofStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, proofUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `proof-${uniqueSuffix}${ext}`);
  }
});

// Configure slider uploads storage
const sliderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, sliderUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `slider-${uniqueSuffix}${ext}`);
  }
});

// Configure hero slider uploads storage
const heroSliderStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, heroSliderUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `hero-slider-${uniqueSuffix}${ext}`);
  }
});

// Configure game card uploads storage
const gameCardStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, gameCardUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `gamecard-${uniqueSuffix}${ext}`);
  }
});

// Configure match banner uploads storage
const matchBannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, matchBannerUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `match-banner-${uniqueSuffix}${ext}`);
  }
});

// Create multer instances for different upload types
const proofUpload = multer({ 
  storage: proofStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

const sliderUpload = multer({ 
  storage: sliderStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  fileFilter: fileFilter
});

const heroSliderUpload = multer({ 
  storage: heroSliderStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  fileFilter: fileFilter
});

const gameCardUpload = multer({ 
  storage: gameCardStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  fileFilter: fileFilter
});

const matchBannerUpload = multer({ 
  storage: matchBannerStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  fileFilter: fileFilter
});

// Configure market banner uploads storage
const marketBannerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, marketBannerUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `market-banner-${uniqueSuffix}${ext}`);
  }
});

// Configure QR code uploads storage
const qrCodeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, qrCodeUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `qr-code-${uniqueSuffix}${ext}`);
  }
});

const marketBannerUpload = multer({ 
  storage: marketBannerStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  fileFilter: fileFilter
});

const qrCodeUpload = multer({ 
  storage: qrCodeStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  fileFilter: fileFilter
});

export function setupUploadRoutes(app: express.Express) {
  // Handle authentication middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
  };
  
  // Handle admin role check middleware
  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user || (req.user as any).role !== UserRole.ADMIN) {
      return res.status(403).json({ message: 'Forbidden - Admin access required' });
    }
    next();
  };

  // API route to upload proof images
  app.post('/api/upload/proof', requireAuth, proofUpload.single('proofImage'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/proofs/${req.file.filename}`;
      
      // Return the URL to the client
      res.json({ 
        success: true, 
        imageUrl: fileUrl 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });
  
  // API route to upload slider images (admin only)
  app.post('/api/upload/slider', requireAdmin, sliderUpload.single('sliderImage'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/sliders/${req.file.filename}`;
      
      // Return the URL to the client
      res.json({ 
        success: true, 
        imageUrl: fileUrl 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });
  
  // API route to get all slider images
  app.get('/api/sliders', async (req: Request, res: Response) => {
    try {
      // Read the sliders directory
      const files = fs.readdirSync(sliderUploadsDir);
      
      // Map to URLs
      const sliderImages = files.map(file => ({
        filename: file,
        url: `/uploads/sliders/${file}`
      }));
      
      res.json(sliderImages);
    } catch (error) {
      console.error('Error fetching slider images:', error);
      res.status(500).json({ error: 'Failed to fetch slider images' });
    }
  });
  
  // API route to delete a slider image (admin only)
  app.delete('/api/sliders/:filename', requireAdmin, (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(sliderUploadsDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      
      res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting slider image:', error);
      res.status(500).json({ error: 'Failed to delete slider image' });
    }
  });
  
  // API route to upload hero slider images (admin only)
  app.post('/api/upload/heroslider', requireAdmin, heroSliderUpload.single('heroSliderImage'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Generate URL for the uploaded file
      const fileUrl = `/uploads/hero-sliders/${req.file.filename}`;
      
      // Return the URL to the client
      res.json({ 
        success: true, 
        imageUrl: fileUrl 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });
  
  // API route to get all hero slider images
  app.get('/api/herosliders', async (req: Request, res: Response) => {
    try {
      // Read the hero sliders directory
      const files = fs.readdirSync(heroSliderUploadsDir);
      
      // Map to URLs
      const heroSliderImages = files.map(file => ({
        filename: file,
        url: `/uploads/hero-sliders/${file}`
      }));
      
      res.json(heroSliderImages);
    } catch (error) {
      console.error('Error fetching hero slider images:', error);
      res.status(500).json({ error: 'Failed to fetch hero slider images' });
    }
  });
  
  // API route to delete a hero slider image (admin only)
  app.delete('/api/herosliders/:filename', requireAdmin, (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(heroSliderUploadsDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      
      res.json({ success: true, message: 'Hero slider image deleted successfully' });
    } catch (error) {
      console.error('Error deleting hero slider image:', error);
      res.status(500).json({ error: 'Failed to delete hero slider image' });
    }
  });
  
  // API route to upload game card images (admin only)
  app.post('/api/upload/gamecard', requireAdmin, gameCardUpload.single('gameCardImage'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Get game type from request body (market, cricket, sports, coinflip)
      const { gameType } = req.body;
      
      if (!gameType) {
        return res.status(400).json({ error: 'Game type is required' });
      }

      // Create a new filename that includes the game type for better organization
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(req.file.originalname);
      const newFilename = `gamecard-${gameType}-${uniqueSuffix}${ext}`;
      
      // Create the new file path 
      const oldPath = path.join(gameCardUploadsDir, req.file.filename);
      const newPath = path.join(gameCardUploadsDir, newFilename);
      
      // Rename the file to include the game type
      fs.renameSync(oldPath, newPath);
      
      // Generate URL for the uploaded file
      const fileUrl = `/uploads/gamecards/${newFilename}`;
      
      // Return the URL to the client
      res.json({ 
        success: true, 
        imageUrl: fileUrl,
        gameType: gameType,
        filename: newFilename
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });
  
  // API route to get all game card images, optionally filtered by game type
  app.get('/api/gamecards', async (req: Request, res: Response) => {
    try {
      const gameType = req.query.gameType as string | undefined;
      
      // Read the game cards directory
      const files = fs.readdirSync(gameCardUploadsDir);
      
      // Filter by game type if provided
      const filteredFiles = gameType 
        ? files.filter(file => file.includes(`gamecard-${gameType}-`))
        : files;
      
      // Map to URLs
      const gameCardImages = filteredFiles.map(file => {
        // Extract game type from filename, ensuring we handle existing files correctly
        let gameType = 'unknown';
        
        // Handle the newer format (with gameType in the name)
        const typeMatch = file.match(/gamecard-(market|sports|cricket|coinflip)-\d+/);
        if (typeMatch) {
          gameType = typeMatch[1];
        } 
        // Handle older format or files without proper game type
        else if (file.includes('market')) {
          gameType = 'market';
        } else if (file.includes('sports')) {
          gameType = 'sports';
        } else if (file.includes('cricket')) {
          gameType = 'cricket';
        } else if (file.includes('coinflip')) {
          gameType = 'coinflip';
        }
        
        return {
          filename: file,
          url: `/uploads/gamecards/${file}`,
          gameType: gameType
        };
      });
      
      res.json(gameCardImages);
    } catch (error) {
      console.error('Error fetching game card images:', error);
      res.status(500).json({ error: 'Failed to fetch game card images' });
    }
  });
  
  // API route to delete a game card image (admin only)
  app.delete('/api/gamecards/:filename', requireAdmin, (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(gameCardUploadsDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      
      res.json({ success: true, message: 'Game card image deleted successfully' });
    } catch (error) {
      console.error('Error deleting game card image:', error);
      res.status(500).json({ error: 'Failed to delete game card image' });
    }
  });

  // API route to upload match banner images (admin only)
  app.post('/api/upload/match-banner', requireAdmin, matchBannerUpload.single('matchBannerImage'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Generate URL for the uploaded file
      const fileUrl = `/uploads/match-banners/${req.file.filename}`;
      
      // Return the URL to the client
      res.json({ 
        success: true, 
        imageUrl: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });
  
  // API route to get all match banner images
  app.get('/api/match-banners', async (req: Request, res: Response) => {
    try {
      // Read the match banners directory
      const files = fs.readdirSync(matchBannerUploadsDir);
      
      // Map to URLs
      const matchBannerImages = files.map(file => ({
        filename: file,
        url: `/uploads/match-banners/${file}`
      }));
      
      res.json(matchBannerImages);
    } catch (error) {
      console.error('Error fetching match banner images:', error);
      res.status(500).json({ error: 'Failed to fetch match banner images' });
    }
  });
  
  // API route to delete a match banner image (admin only)
  app.delete('/api/match-banners/:filename', requireAdmin, (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(matchBannerUploadsDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      
      res.json({ success: true, message: 'Match banner image deleted successfully' });
    } catch (error) {
      console.error('Error deleting match banner image:', error);
      res.status(500).json({ error: 'Failed to delete match banner image' });
    }
  });

  // API route to upload market banner images (admin only)
  app.post('/api/upload/market-banner', requireAdmin, marketBannerUpload.single('marketBannerImage'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Generate URL for the uploaded file
      const fileUrl = `/uploads/market-banners/${req.file.filename}`;
      
      // Return the URL to the client
      res.json({ 
        success: true, 
        imageUrl: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });
  
  // API route to get all market banner images
  app.get('/api/market-banners', async (req: Request, res: Response) => {
    try {
      // Read the market banners directory
      const files = fs.readdirSync(marketBannerUploadsDir);
      
      // Map to URLs
      const marketBannerImages = files.map(file => ({
        filename: file,
        url: `/uploads/market-banners/${file}`
      }));
      
      res.json(marketBannerImages);
    } catch (error) {
      console.error('Error fetching market banner images:', error);
      res.status(500).json({ error: 'Failed to fetch market banner images' });
    }
  });
  
  // API route to delete a market banner image (admin only)
  app.delete('/api/market-banners/:filename', requireAdmin, (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(marketBannerUploadsDir, filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Image not found' });
      }
      
      // Delete the file
      fs.unlinkSync(filePath);
      
      res.json({ success: true, message: 'Market banner image deleted successfully' });
    } catch (error) {
      console.error('Error deleting market banner image:', error);
      res.status(500).json({ error: 'Failed to delete market banner image' });
    }
  });

  // API route to upload QR code images (admin only)
  app.post('/api/upload/qr-code', requireAdmin, qrCodeUpload.single('qrImage'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Generate URL for the uploaded file
      const fileUrl = `/uploads/qr-codes/${req.file.filename}`;
      
      // Return the URL to the client
      res.json({ 
        success: true, 
        imageUrl: fileUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });

  // Allow access to static uploads
  app.use('/uploads', express.static(uploadsDir));
}