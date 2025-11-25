# MySQL to MongoDB Migration Guide

## Overview
This script migrates all data from MySQL to MongoDB for comprehensive testing.

## Prerequisites

1. **MySQL must be running** with data
2. **MongoDB must be accessible** (via port-forward or direct connection)
3. **Node.js dependencies** installed:
   ```bash
   npm install mysql2 mongodb
   ```

## Configuration

The script uses environment variables. Create a `.env` file or set these:

### MySQL Connection
```bash
MYSQL_HOST=localhost          # or your MySQL host
MYSQL_PORT=3306              # MySQL port
MYSQL_USER=root              # MySQL username
MYSQL_PASSWORD=your_password # MySQL password
MYSQL_DB=airbnb_core         # MySQL database name
```

### MongoDB Connection
```bash
MONGODB_HOST=localhost       # MongoDB host (use localhost for port-forward)
MONGODB_PORT=27018           # MongoDB port (27018 for port-forward, 27017 for direct)
MONGODB_USER=admin           # MongoDB username
MONGODB_PASSWORD=change-me-in-production  # MongoDB password
MONGODB_DB=airbnb_core       # MongoDB database name
```

**Note**: If using Kubernetes port-forward:
- MongoDB port should be `27018` (port-forwarded)
- Connection will be: `mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin`

## Running the Migration

### Step 1: Setup Port-Forward (if using Kubernetes)
```bash
kubectl port-forward -n airbnb-system svc/mongodb-service 27018:27017
```

### Step 2: Run Migration
```bash
node migrate_mysql_to_mongodb.js
```

## What Gets Migrated

The script migrates in this order (respecting foreign key dependencies):

1. **Owners** → `owners` collection`
2. **Properties** → `properties` collection`
3. **Property Photos** → `property_photos` collection`
4. **Users (Travelers)** → `users` collection`
5. **Traveler Profiles** → `traveler_profiles` collection`
6. **Bookings** → `bookings` collection`
7. **Favorites** → `favorites` collection`

## Features

- ✅ **Duplicate Prevention**: Checks for existing records by email/name before inserting
- ✅ **ID Mapping**: Maps MySQL INT IDs to MongoDB ObjectIds
- ✅ **Relationship Preservation**: Maintains foreign key relationships
- ✅ **JSON Handling**: Properly parses MySQL JSON fields
- ✅ **Error Handling**: Skips invalid records and continues
- ✅ **Progress Logging**: Shows detailed progress for each table

## Troubleshooting

### "MySQL connection failed"
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `.env` file
- Ensure database exists: `SHOW DATABASES;`

### "MongoDB connection failed"
- Check port-forward is running: `lsof -i :27018`
- Verify MongoDB credentials
- Test connection: `mongosh "mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin"`

### "Owner not found" errors
- This is normal if properties reference owners that don't exist
- Script will skip invalid records and continue

### Data already exists
- Script checks for duplicates and skips existing records
- Safe to run multiple times (idempotent)

## Verification

After migration, verify data:

```bash
# Check MongoDB collections
node -e "const {MongoClient}=require('mongodb');(async()=>{const c=new MongoClient('mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin');await c.connect();const db=c.db('airbnb_core');console.log('Owners:',await db.collection('owners').countDocuments());console.log('Properties:',await db.collection('properties').countDocuments());console.log('Photos:',await db.collection('property_photos').countDocuments());console.log('Users:',await db.collection('users').countDocuments());console.log('Bookings:',await db.collection('bookings').countDocuments());await c.close();})();"
```

## Next Steps

After migration:
1. ✅ Verify images are displayed (photos should now exist)
2. ✅ Test property search
3. ✅ Test bookings
4. ✅ Test favorites
5. ✅ Complete end-to-end testing

