# Airbnb Traveler Frontend

A React-based frontend application for the Airbnb traveler side, built with Vite, React Router, and Bootstrap.

## Features

- **Authentication**: Signup, login, and logout with session management
- **Property Search**: Advanced search with filters for location, dates, guests, and property type
- **Property Details**: Comprehensive property information with booking functionality
- **Profile Management**: Complete traveler profile with photo upload
- **Booking Management**: View and manage bookings (pending, accepted, cancelled)
- **Favorites**: Save and manage favorite properties
- **AI Travel Assistant**: Integrated AI chat for travel recommendations and planning

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Bootstrap 5** - CSS framework
- **CSS-in-JS** - Styled components with jsx

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running on port 5001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp env.example .env
```

3. Update environment variables in `.env`:
```
VITE_API_URL=http://localhost:5001
VITE_AGENT_API_URL=http://localhost:8000
```

4. Start development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # Navigation header
│   ├── PropertyCard.jsx # Property display card
│   ├── SearchBar.jsx   # Property search form
│   ├── AIAgentButton.jsx # AI assistant button
│   └── AIAgentPanel.jsx # AI chat panel
├── context/            # React context providers
│   └── AuthContext.jsx # Authentication state
├── pages/              # Page components
│   ├── Home.jsx        # Landing page
│   ├── Login.jsx       # Login page
│   ├── Signup.jsx      # Registration page
│   ├── Profile.jsx     # User profile page
│   ├── Dashboard.jsx   # Property search/dashboard
│   ├── PropertyDetails.jsx # Property details page
│   ├── Bookings.jsx    # Booking management
│   └── Favorites.jsx   # Favorite properties
├── services/           # API service layer
│   └── api.js          # Axios configuration and API calls
├── utils/              # Utility functions
├── App.jsx             # Main app component
├── App.css             # Global styles
└── main.jsx            # Application entry point
```

## API Integration

The frontend communicates with the following APIs:

- **Traveler API** (port 5001): Authentication, profiles, bookings, favorites
- **Properties API** (port 5001): Property search and details
- **AI Agent API** (port 8000): Travel recommendations and planning

## Key Features

### Authentication
- Session-based authentication with cookies
- Protected routes for authenticated users
- Automatic redirect to login for protected pages

### Property Search
- Advanced search with multiple filters
- Real-time availability checking
- Responsive property grid layout
- Pagination support

### Booking System
- Date range selection with availability checking
- Guest count validation
- Special requests support
- Booking status management (pending, accepted, cancelled)

### AI Integration
- Floating AI assistant button
- Slide-in chat panel
- Context-aware travel recommendations
- Natural language processing

## Responsive Design

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Style

- ESLint configuration included
- Consistent component structure
- CSS-in-JS with jsx styling
- Responsive-first design approach

## Deployment

The application can be deployed to any static hosting service:

1. Build the application: `npm run build`
2. Upload the `dist` directory to your hosting service
3. Configure environment variables on your hosting platform

## Contributing

1. Follow the existing code style
2. Add appropriate error handling
3. Include responsive design considerations
4. Test on multiple devices and browsers

## License

This project is part of the Airbnb prototype assignment.