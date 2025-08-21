const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com", "https://cdnjs.cloudflare.com", "https://www.clarity.ms", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Default accommodation prices configuration
const ACCOMMODATION_PRICES = {
  pinot: 498,
  rose: 498,
  cottage: 245
};

// Helper function to get accommodation prices
async function getAccommodationPrices() {
  // When Uplisting API is available, implement the API call here
  // For now, return configured prices
  try {
    // Uplisting API integration - uncomment when environment variables are set
    if (process.env.UPLISTING_API_KEY && process.env.UPLISTING_API_URL) {
      const response = await fetch(`${process.env.UPLISTING_API_URL}/properties/rates`, {
        headers: {
          'Authorization': `Bearer ${process.env.UPLISTING_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      // TODO: Process Uplisting data format and return mapped prices
      // return processUplistingPrices(data);
    }
    
    return ACCOMMODATION_PRICES;
  } catch (error) {
    logger.error('Error fetching live prices, using defaults:', error);
    return ACCOMMODATION_PRICES;
  }
}

// ACCOMMODATIONS ENDPOINT
app.get('/api/accommodations', async (req, res) => {
  try {
    const prices = await getAccommodationPrices();
    
    const accommodations = [
      {
        id: 'pinot',
        name: 'Dome Pinot',
        price: prices.pinot,
        description: 'Luxury dome with stunning lake views',
        maxGuests: 2,
        priceSource: process.env.UPLISTING_API_KEY ? 'live' : 'configured'
      },
      {
        id: 'rose',
        name: 'Dome Rosé', 
        price: prices.rose,
        description: 'Romantic dome perfect for couples',
        maxGuests: 2,
        priceSource: process.env.UPLISTING_API_KEY ? 'live' : 'configured'
      },
      {
        id: 'cottage',
        name: 'Lakeside Cottage',
        price: prices.cottage,
        description: 'Cozy cottage with lake access',
        maxGuests: 4,
        priceSource: process.env.UPLISTING_API_KEY ? 'live' : 'configured'
      }
    ];
    
    logger.info('Accommodations fetched successfully', {
      totalAccommodations: accommodations.length,
      priceSource: process.env.UPLISTING_API_KEY ? 'live' : 'configured'
    });
    
    res.json({ accommodations });
  } catch (error) {
    logger.error('Error fetching accommodations:', error);
    res.status(500).json({ error: 'Unable to fetch accommodations' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;
    
    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    
    // Log contact form submission
    logger.info('Contact form submission received', {
      name,
      email,
      hasPhone: !!phone,
      messageLength: message.length
    });
    
    // TODO: Implement email sending when email service is configured
    // await sendContactEmail({ name, email, message, phone });
    
    res.json({ 
      success: true, 
      message: 'Thank you for your message. We will get back to you soon!' 
    });
  } catch (error) {
    logger.error('Error processing contact form:', error);
    res.status(500).json({ error: 'Unable to process contact form' });
  }
});

// Enhanced booking system - database integration with fallback
const { Pool } = require('pg');
let db = null;
const bookings = new Map(); // Fallback storage

// Initialize database connection if available
if (process.env.DATABASE_URL) {
  try {
    db = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    db.query('SELECT NOW()')
      .then(() => logger.info('Database connected successfully'))
      .catch(err => {
        logger.error('Database connection failed, using memory storage:', err);
        db = null;
      });
  } catch (error) {
    logger.error('Database initialization failed:', error);
    db = null;
  }
}

// Helper function to generate booking reference
function generateBookingReference() {
  return 'LR' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
}

// Create Stripe payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Payment processing not configured' });
    }
    
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { accommodationId, checkIn, checkOut, guests } = req.body;
    
    // Calculate pricing
    const prices = { pinot: 659, rose: 659, cottage: 357 };
    const nightlyRate = prices[accommodationId] || 500;
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const subtotal = nightlyRate * nights;
    const serviceFee = Math.round(subtotal * 0.05);
    const gst = Math.round((subtotal + serviceFee) * 0.15);
    const total = subtotal + serviceFee + gst;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
      currency: 'nzd',
      metadata: {
        accommodationId,
        checkIn,
        checkOut,
        guests: guests.toString()
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      pricing: {
        nightlyRate,
        nights,
        subtotal,
        serviceFee,
        gst,
        total
      }
    });
    
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Unable to create payment intent' });
  }
});

// Process completed booking
app.post('/api/process-booking', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate required fields
    const required = ['accommodationId', 'checkIn', 'checkOut', 'firstName', 'lastName', 'email', 'phone'];
    const missing = required.filter(field => !bookingData[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({ error: 'Missing required fields', missing });
    }
    
    // Generate booking reference
    const bookingReference = generateBookingReference();
    
    // Create booking record
    const booking = {
      bookingReference,
      accommodationId: bookingData.accommodationId,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      guests: {
        adults: parseInt(bookingData.adults || 2),
        children: parseInt(bookingData.children || 0)
      },
      guest: {
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        email: bookingData.email,
        phone: bookingData.phone
      },
      specialRequests: bookingData.specialRequests || '',
      paymentIntentId: bookingData.paymentIntentId,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    
    // Store booking (database if available, otherwise memory)
    if (db) {
      try {
        // Simple insert - we'll create the table if it doesn't exist
        await db.query(`
          CREATE TABLE IF NOT EXISTS bookings (
            id SERIAL PRIMARY KEY,
            booking_reference VARCHAR(20) UNIQUE,
            data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        await db.query(
          'INSERT INTO bookings (booking_reference, data) VALUES ($1, $2)',
          [bookingReference, JSON.stringify(booking)]
        );
        
        logger.info('Booking saved to database', { bookingReference });
      } catch (dbError) {
        logger.error('Database save failed, using memory:', dbError);
        bookings.set(bookingReference, booking);
      }
    } else {
      bookings.set(bookingReference, booking);
    }
    
    logger.info('Booking created successfully', {
      bookingReference,
      accommodationId: booking.accommodationId,
      email: booking.guest.email
    });
    
    res.json({
      success: true,
      bookingReference,
      booking: {
        reference: bookingReference,
        accommodationId: booking.accommodationId,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        status: booking.status
      }
    });
    
  } catch (error) {
    logger.error('Error processing booking:', error);
    res.status(500).json({ error: 'Unable to process booking' });
  }
});

// Get booking details
app.get('/api/bookings/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    let booking = null;
    
    // Try database first, then fallback to memory
    if (db) {
      try {
        const result = await db.query(
          'SELECT data FROM bookings WHERE booking_reference = $1',
          [reference]
        );
        if (result.rows.length > 0) {
          booking = result.rows[0].data;
        }
      } catch (dbError) {
        logger.error('Database query failed:', dbError);
      }
    }
    
    if (!booking) {
      booking = bookings.get(reference);
    }
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ booking });
    
  } catch (error) {
    logger.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Unable to fetch booking' });
  }
});

// Legacy booking endpoint (keeping for compatibility)
app.post('/api/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Validate booking data
    if (!bookingData.accommodationId || !bookingData.checkIn || !bookingData.checkOut) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }
    
    logger.info('Legacy booking request received', {
      accommodationId: bookingData.accommodationId,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut
    });
    
    res.json({ 
      success: true,
      message: 'Booking request received. Use /api/process-booking for complete booking flow.',
      endpoints: {
        createPayment: '/api/create-payment-intent',
        processBooking: '/api/process-booking'
      }
    });
  } catch (error) {
    logger.error('Error in legacy booking endpoint:', error);
    res.status(500).json({ error: 'Unable to process booking request' });
  }
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'indexV11.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;