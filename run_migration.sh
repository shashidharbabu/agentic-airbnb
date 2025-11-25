#!/bin/bash
# MySQL to MongoDB Migration Runner
# Handles port-forward setup and runs migration

set -e

echo "🚀 MySQL to MongoDB Migration"
echo "=============================="
echo ""

# Check if port-forward is already running
if lsof -Pi :27018 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Port-forward already running on 27018"
    # Test connection
    if node -e "const {MongoClient}=require('mongodb');(async()=>{try{const c=new MongoClient('mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin');await c.connect();console.log('✅ MongoDB connection verified');await c.close();process.exit(0);}catch(e){console.error('❌ Connection failed');process.exit(1);}})();" 2>/dev/null; then
        echo "✅ MongoDB connection verified"
    else
        echo "⚠️  Port 27018 is in use but connection failed"
        echo "   Killing existing port-forward..."
        pkill -f "kubectl port-forward.*mongodb-service.*27018" || true
        sleep 2
        echo "   Starting new port-forward..."
        kubectl port-forward -n airbnb-system svc/mongodb-service 27018:27017 > /tmp/mongodb-pf.log 2>&1 &
        echo $! > /tmp/mongodb-pf.pid
        sleep 3
    fi
else
    echo "📡 Starting port-forward for MongoDB..."
    kubectl port-forward -n airbnb-system svc/mongodb-service 27018:27017 > /tmp/mongodb-pf.log 2>&1 &
    echo $! > /tmp/mongodb-pf.pid
    sleep 3
    echo "✅ Port-forward started (PID: $(cat /tmp/mongodb-pf.pid))"
fi

echo ""
echo "📦 Running migration..."
echo ""

# Run migration
node migrate_mysql_to_mongodb.js

MIGRATION_EXIT=$?

echo ""
if [ $MIGRATION_EXIT -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Verifying data..."
    node -e "
    const {MongoClient}=require('mongodb');
    (async()=>{
        const c=new MongoClient('mongodb://admin:change-me-in-production@localhost:27018/airbnb_core?authSource=admin');
        await c.connect();
        const db=c.db('airbnb_core');
        console.log('  Owners:', await db.collection('owners').countDocuments());
        console.log('  Properties:', await db.collection('properties').countDocuments());
        console.log('  Photos:', await db.collection('property_photos').countDocuments());
        console.log('  Users:', await db.collection('users').countDocuments());
        console.log('  Bookings:', await db.collection('bookings').countDocuments());
        console.log('  Favorites:', await db.collection('favorites').countDocuments());
        await c.close();
    })();
    "
else
    echo "❌ Migration failed with exit code $MIGRATION_EXIT"
    echo "   Check the output above for errors"
fi

echo ""
echo "💡 To stop port-forward: kill \$(cat /tmp/mongodb-pf.pid)"

