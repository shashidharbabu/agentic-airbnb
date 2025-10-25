# Airbnb Traveler Backend API

A Node.js + Express.js + MySQL backend API for the Airbnb traveler side, providing authentication, property search, booking management, and favorites functionality.

## Features

- **Authentication**: Secure signup, login, logout with bcrypt password hashing
- **Session Management**: Express-session with MySQL store
- **Profile Management**: Complete traveler profile with image upload
- **Property Search**: Advanced search with filters and availability checking
- **Booking System**: Create, view, and cancel bookings
- **Favorites**: Add/remove properties from favorites
- **File Upload**: Profile picture upload with validation
- **API Documentation**: Swagger/OpenAPI documentation

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **bcryptjs** - Password hashing
- **express-session** - Session management
- **express-mysql-session** - MySQL session store
- **multer** - File upload handling
- **joi** - Request validation
- **swagger-jsdoc** - API documentation

## Getting Started

### Prerequisites

- Node.js 16+
- MySQL 8.0+
- npm or yarn

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
```bash
PORT=5001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=airbnb_core
SESSION_SECRET=your-secret-key-change-in-production
WEB_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

4. Setup MySQL database:
```bash
# Run the SQL schema file
mysql -u root -p < sql/schema.sql
```

5. Start the server:
```bash
npm run dev
```

The API will be available at `http://localhost:5001`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:5001/docs`
- **Health Check**: `http://localhost:5001/health`

## Database Schema

The API uses the following main tables:

### travelers
- User profiles with authentication and personal information
- Fields: id, email, password_hash, name, phone, about_me, city, state, country, languages, gender, profile_picture

### traveler_favorites
- User's favorite properties
- Fields: id, traveler_id, property_id, created_at

### bookings (extends existing table)
- Traveler bookings with status management
- Fields: id, property_id, traveler_id, start_date, end_date, guests, status, total_price, special_requests

### properties (from host side)
- Property listings for search and booking
- Fields: id, owner_id, name, description, location, price_per_night, bedrooms, bathrooms, amenities, etc.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new traveler account
- `POST /api/auth/login` - Login traveler
- `POST /api/auth/logout` - Logout traveler
- `GET /api/auth/me` - Get current traveler
- `GET /api/auth/check` - Check authentication status

### Traveler Profile
- `GET /api/traveler/profile` - Get traveler profile
- `PUT /api/traveler/profile` - Update traveler profile
- `POST /api/traveler/profile/picture` - Upload profile picture
- `GET /api/traveler/profile/:id` - Get public traveler profile

### Properties
- `GET /api/properties/search` - Search properties with filters
- `GET /api/properties/:id` - Get property details
- `GET /api/properties/:id/availability` - Check property availability

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/traveler/:id` - Get traveler's bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Favorites
- `POST /api/favorites` - Add property to favorites
- `DELETE /api/favorites/:propertyId` - Remove from favorites
- `GET /api/favorites/traveler/:id` - Get traveler's favorites
- `GET /api/favorites/check/:propertyId` - Check if property is favorited

## Request/Response Examples

### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Search Properties
```bash
GET /api/properties/search?location=Paris&check_in=2024-01-15&check_out=2024-01-18&guests=2
```

### Create Booking
```bash
POST /api/bookings
Content-Type: application/json

{
  "property_id": 1,
  "start_date": "2024-01-15",
  "end_date": "2024-01-18",
  "guests": 2,
  "special_requests": "Late check-in please"
}
```

## Security Features

- Password hashing with bcrypt (10 rounds)
- Session-based authentication
- CORS configuration
- Input validation with Joi
- File upload validation
- SQL injection prevention with parameterized queries

## Error Handling

The API provides consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## File Upload

Profile pictures are uploaded to the `uploads/` directory with:
- Image file validation
- Size limit (5MB default)
- Unique filename generation
- Static file serving at `/uploads/`

## Session Configuration

- Session name: `airbnb_traveller.sid`
- Duration: 7 days
- Secure cookies in production
- MySQL session store for persistence

## Development

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Project Structure

```
src/
├── config/           # Configuration files
│   └── database.js   # MySQL connection setup
├── middleware/       # Express middleware
│   ├── auth.js       # Authentication middleware
│   └── upload.js     # File upload middleware
├── routes/           # API route handlers
│   ├── auth.js       # Authentication routes
│   ├── traveler.js   # Traveler profile routes
│   ├── properties.js # Property search routes
│   ├── bookings.js   # Booking management routes
│   └── favorites.js  # Favorites routes
├── utils/            # Utility functions
├── server.js         # Main server file
└── package.json      # Dependencies and scripts
```

## Testing

Test the API endpoints using:

1. **Swagger UI**: `http://localhost:5001/docs`
2. **Postman**: Import the API collection
3. **curl**: Command line testing

Example health check:
```bash
curl http://localhost:5001/health
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `SESSION_SECRET`
3. Configure proper CORS origins
4. Use HTTPS in production
5. Set up proper logging
6. Configure database connection pooling
7. Use a reverse proxy (nginx)

## Integration with Host Side

This traveler API integrates with the host-side API by:
- Sharing the same database (`airbnb_core`)
- Using the same `properties` table
- Coordinating booking status updates
- Maintaining data consistency

## License

This project is part of the Airbnb prototype assignment.
