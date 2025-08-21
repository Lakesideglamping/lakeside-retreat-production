# Lakeside Retreat Website

Luxury glamping accommodation website for Lakeside Retreat in Central Otago, New Zealand.

## Features

- Responsive design optimized for all devices
- SEO-optimized with structured data
- Secure backend with rate limiting and input validation
- Integration ready for Uplisting and Stripe
- Energy-positive solar-powered accommodation showcase

## Setup

### Prerequisites

- Node.js v16.0.0 or higher
- npm v8.0.0 or higher

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd lakeside-retreat-website
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`

5. Start the server:
```bash
npm start
```

The website will be available at `http://localhost:3000`

## Development

```bash
npm run dev
```

This runs the server with nodemon for automatic restarts on file changes.

## Production Deployment

The website is configured for deployment on Railway, Kinsta, or any Node.js hosting platform.

### Railway Deployment

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Environment Variables

See `.env.example` for required environment variables.

## Security

- All user inputs are validated
- Rate limiting is implemented on API endpoints
- CSP headers are configured
- CORS is properly configured
- Logging is implemented with Winston

## Accommodation Pricing

Current prices are configured in `server-secure.js`:
- Dome Pinot: $498 per night
- Dome Rosé: $498 per night
- Lakeside Cottage: $245 per night

When the Uplisting API is available, uncomment the API integration code in the `getAccommodationPrices()` function.

## Support

For issues or questions, please contact the development team.

## License

Copyright © 2024 Lakeside Retreat. All rights reserved.