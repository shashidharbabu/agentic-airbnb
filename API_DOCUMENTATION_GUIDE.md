# API Documentation Guide

## 📚 Complete API Documentation

Both the **Host API** and **Traveler API** now have fully documented Swagger/OpenAPI 3.0 endpoints.

---

## 🌐 Access API Documentation

### **Host API Documentation**
- **URL**: http://localhost:4000/api-docs
- **Description**: Complete documentation for property owners/hosts
- **Port**: 4000

### **Traveler API Documentation**
- **URL**: http://localhost:5001/api-docs
- **Description**: Complete documentation for travelers/guests
- **Port**: 5001

---

## 🚀 How to View Documentation

1. **Start the Host Backend**:
   ```bash
   cd backend/host
   npm start
   ```
   Then open: http://localhost:4000/api-docs

2. **Start the Traveler Backend**:
   ```bash
   cd backend/traveller
   npm start
   ```
   Then open: http://localhost:5001/api-docs

---

## 📖 What's Documented

### **Host API Endpoints** (http://localhost:4000/api-docs)

#### Authentication
- `POST /auth/signup` - Create new host account
- `POST /auth/login` - Login host
- `POST /auth/logout` - Logout host
- `GET /auth/me` - Get current host profile
- `PUT /auth/profile` - Update host profile
- `POST /auth/profile/picture` - Upload profile picture
- `DELETE /auth/profile/picture` - Delete profile picture

#### Properties
- `POST /properties` - Create new property listing
- `GET /properties/mine` - Get all properties owned by host
- `GET /properties/:id` - Get property details
- `PUT /properties/:id` - Update property
- `DELETE /properties/:id` - Delete property
- `POST /properties/:id/photos` - Upload property photos
- `DELETE /properties/:id/photos/:photoId` - Delete property photo

#### Bookings
- `GET /bookings/incoming` - Get incoming booking requests
- `GET /bookings/property/:propertyId` - Get all bookings for a property
- `POST /bookings/:id/accept` - Accept booking request
- `POST /bookings/:id/cancel` - Cancel booking

---

### **Traveler API Endpoints** (http://localhost:5001/api-docs)

#### Authentication
- `POST /api/auth/signup` - Create new traveler account
- `POST /api/auth/login` - Login traveler
- `POST /api/auth/logout` - Logout traveler
- `GET /api/auth/check` - Check authentication status

#### Traveler Profile
- `GET /api/traveler/profile` - Get traveler profile
- `PUT /api/traveler/profile` - Update traveler profile
- `POST /api/traveler/profile/picture` - Upload profile picture

#### Properties
- `GET /api/properties/search` - Search available properties
  - Query params: location, check_in, check_out, guests, property_type, min_price, max_price, page, limit
- `GET /api/properties/:id` - Get property details

#### Bookings
- `POST /api/bookings` - Create new booking request
- `GET /api/bookings` - Get traveler's bookings
- `GET /api/bookings/:id` - Get specific booking
- `PUT /api/bookings/:id/cancel` - Cancel booking

#### Favorites
- `POST /api/favorites` - Add property to favorites
- `DELETE /api/favorites/:propertyId` - Remove from favorites
- `GET /api/favorites/traveler/:travelerId` - Get traveler's favorites

---

## 🔐 Authentication

Both APIs use **session-based authentication** with HTTP-only cookies:

- **Host API**: Uses `airbnb_host.sid` cookie
- **Traveler API**: Uses `airbnb_traveller.sid` cookie

### How to Test Authenticated Endpoints:

1. First, call the `/signup` or `/login` endpoint
2. The session cookie will be set automatically
3. Subsequent requests will include the cookie
4. In Swagger UI, the cookie is managed automatically after login

---

## 📋 Data Models

### Complete schemas are available in Swagger UI including:

**Host API**:
- Property
- Booking
- Owner

**Traveler API**:
- Traveler
- Property
- Booking
- Favorite

---

## 🧪 Testing with Swagger UI

### Interactive Testing:
1. Navigate to the API documentation URL
2. Expand any endpoint
3. Click **"Try it out"**
4. Fill in the required parameters
5. Click **"Execute"**
6. View the response

### Example: Creating a Booking

1. Go to http://localhost:5001/api-docs
2. Find `POST /api/bookings` under **Bookings**
3. Click **"Try it out"**
4. Enter request body:
   ```json
   {
     "property_id": 1,
     "start_date": "2025-11-01",
     "end_date": "2025-11-05",
     "guests": 2,
     "total_price": 500,
     "special_requests": "Early check-in if possible"
   }
   ```
5. Click **"Execute"**
6. See the response with booking details

---

## 📥 Exporting Postman Collection

If you prefer Postman over Swagger UI:

1. Open the Swagger documentation URL
2. Look for the `/api-docs/swagger.json` endpoint
3. Import this JSON file into Postman
4. Or use this direct URL in Postman's import:
   - Host API: `http://localhost:4000/api-docs/swagger.json`
   - Traveler API: `http://localhost:5001/api-docs/swagger.json`

---

## ✅ Features

- ✅ Complete OpenAPI 3.0 specification
- ✅ Interactive "Try it out" functionality
- ✅ Request/Response examples
- ✅ Schema validation
- ✅ Authentication documentation
- ✅ Error response examples
- ✅ Search filters and pagination documented
- ✅ File upload endpoints documented

---

## 🎯 Next Steps

1. Start both backend servers
2. Open the Swagger UI URLs in your browser
3. Test all endpoints interactively
4. Export to Postman if needed
5. Share API documentation with team members

---

## 📞 Support

For API questions or issues:
- Host API: support@airbnb-host.com
- Traveler API: support@airbnb-traveler.com

---

**Documentation Generated**: October 27, 2025  
**Version**: 1.0.0  
**License**: MIT

