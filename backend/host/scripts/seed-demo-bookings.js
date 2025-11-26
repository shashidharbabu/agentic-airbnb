#!/usr/bin/env node

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

// Seeds a host, property, and sample bookings across status tabs (counts configurable).

const DEFAULTS = {
  email: 'host.demo@example.com',
  password: 'HostDemo123!',
  name: 'Demo Host',
  phone: '+1-415-555-0199',
  location: 'San Francisco, CA',
  propertyName: 'City View Loft',
  propertyDescription: 'A bright and modern loft with sweeping skyline views and curated interiors.',
  propertyLocation: 'San Francisco, California',
  propertyAddress: '123 Market Street, San Francisco, CA',
  propertyType: 'Loft',
  propertyPrivacy: 'ENTIRE_HOME',
  pricePerNight: 425.0,
  bedrooms: 2,
  bathrooms: 2,
  maxGuests: 4,
  beds: 2,
  pending: 1,
  accepted: 1,
  cancelled: 1
};

function parseArgs(argv) {
  const config = { ...DEFAULTS };
  const flags = {
    email: false,
    password: false,
    name: false,
    phone: false,
    location: false,
    propertyName: false,
    propertyLocation: false,
    propertyAddress: false,
    propertyDescription: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (typeof raw !== 'string' || !raw.startsWith('--')) continue;

    const withoutPrefix = raw.slice(2);
    const [key, inlineValue] = withoutPrefix.split('=');
    let value = inlineValue;

    if (value === undefined && i + 1 < argv.length && typeof argv[i + 1] === 'string' && !argv[i + 1].startsWith('--')) {
      value = argv[i + 1];
      i += 1;
    }

    switch (key) {
      case 'email':
        if (value) {
          config.email = value.trim().toLowerCase();
          flags.email = true;
        }
        break;
      case 'password':
        if (value) {
          config.password = value;
          flags.password = true;
        }
        break;
      case 'name':
        if (value) {
          config.name = value.trim();
          flags.name = true;
        }
        break;
      case 'phone':
        if (value) {
          config.phone = value.trim();
          flags.phone = true;
        }
        break;
      case 'location':
        if (value) {
          config.location = value.trim();
          flags.location = true;
        }
        break;
      case 'property-name':
        if (value) {
          config.propertyName = value.trim();
          flags.propertyName = true;
        }
        break;
      case 'property-location':
        if (value) {
          config.propertyLocation = value.trim();
          flags.propertyLocation = true;
        }
        break;
      case 'property-address':
        if (value) {
          config.propertyAddress = value.trim();
          flags.propertyAddress = true;
        }
        break;
      case 'property-description':
        if (value) {
          config.propertyDescription = value.trim();
          flags.propertyDescription = true;
        }
        break;
      case 'pending':
      case 'accepted':
      case 'cancelled':
        if (value !== undefined) {
          const parsed = Number.parseInt(value, 10);
          config[key] = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
        }
        break;
      default:
        break;
    }
  }

  return { config, flags };
}

function toSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'demo';
}

function derivePhone(email) {
  const local = email.split('@')[0] || 'host';
  let hash = 0;
  for (const char of local.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) % 10000;
  }
  const suffix = String(1000 + (hash % 9000));
  return `+1-415-555-${suffix}`;
}

function buildNameFromEmail(email) {
  const local = email.split('@')[0] || 'host';
  const cleaned = local.replace(/[^a-z0-9]+/gi, ' ').trim();
  if (!cleaned) return 'Demo Host';
  const words = cleaned.split(/\s+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  return words.join(' ');
}

function buildBookings(config) {
  const bookings = [];
  const slug = toSlug(config.email.split('@')[0] || 'host');
  const statusCounts = [
    ['PENDING', config.pending],
    ['ACCEPTED', config.accepted],
    ['CANCELLED', config.cancelled]
  ];

  const generators = {
    PENDING: (index) => ({
      startOffset: 10 + index * 4,
      endOffset: 13 + index * 4,
      createdOffset: -2 - index,
      guests: 2 + (index % 2)
    }),
    ACCEPTED: (index) => ({
      startOffset: 30 + index * 5,
      endOffset: 34 + index * 5,
      createdOffset: -12 - index * 3,
      guests: 2 + ((index + 1) % 3)
    }),
    CANCELLED: (index) => {
      const start = -24 - index * 5;
      return {
        startOffset: start,
        endOffset: start + 3,
        createdOffset: start - 6,
        guests: 1 + (index % 2)
      };
    }
  };

  statusCounts.forEach(([status, count]) => {
    for (let i = 0; i < count; i += 1) {
      const offsets = generators[status](i);
      const label = status.charAt(0) + status.slice(1).toLowerCase();
      bookings.push({
        status,
        travelerName: `${label} Guest ${i + 1}`,
        travelerEmail: `${status.toLowerCase()}-${i + 1}.${slug}@demo-travelers.test`,
        startOffset: offsets.startOffset,
        endOffset: offsets.endOffset,
        createdOffset: offsets.createdOffset,
        guests: offsets.guests
      });
    }
  });

  return bookings;
}

const { config, flags } = parseArgs(process.argv.slice(2));

if (!flags.phone && config.email !== DEFAULTS.email) {
  config.phone = derivePhone(config.email);
}

if (!flags.name && config.email !== DEFAULTS.email && config.name === DEFAULTS.name) {
  config.name = buildNameFromEmail(config.email);
}

if (!flags.propertyName && config.email !== DEFAULTS.email) {
  config.propertyName = `${config.name || 'Demo Host'}'s Sample Stay`;
}

if (!flags.propertyLocation && config.email !== DEFAULTS.email) {
  config.propertyLocation = config.location || DEFAULTS.propertyLocation;
}

if (!flags.propertyAddress && config.email !== DEFAULTS.email) {
  const baseLocation = config.location || DEFAULTS.location;
  config.propertyAddress = `123 Demo Street, ${baseLocation}`;
}

if (!flags.propertyDescription && config.email !== DEFAULTS.email) {
  config.propertyDescription = `A comfortable stay hosted by ${config.name || 'your host'}.`;
}

const OWNER = {
  email: config.email,
  password: config.password,
  name: config.name,
  phone: config.phone,
  location: config.location
};

const PROPERTY = {
  name: config.propertyName,
  description: config.propertyDescription,
  location: config.propertyLocation,
  address: config.propertyAddress,
  price_per_night: config.pricePerNight,
  bedrooms: config.bedrooms,
  bathrooms: config.bathrooms,
  max_guests: config.maxGuests,
  beds: config.beds,
  property_type: config.propertyType,
  privacy_type: config.propertyPrivacy
};

const today = new Date();

const makeDate = (offsetDays) => {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

const makeTimestamp = (offsetDays) => {
  const date = new Date(today);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const BOOKINGS = buildBookings(config);

async function hasTravelerColumn(conn) {
  const [rows] = await conn.execute(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'traveler_id' LIMIT 1`
  );
  return rows.length > 0;
}

async function ensureOwner(conn) {
  const [rows] = await conn.execute(
    'SELECT id FROM owners WHERE email = :email LIMIT 1',
    { email: OWNER.email }
  );
  if (rows.length > 0) {
    return { id: rows[0].id, created: false };
  }

  const passwordHash = await bcrypt.hash(OWNER.password, 10);
  const [result] = await conn.execute(
    `INSERT INTO owners (email, password_hash, name, phone, location)
     VALUES (:email, :password_hash, :name, :phone, :location)`,
    {
      email: OWNER.email,
      password_hash: passwordHash,
      name: OWNER.name,
      phone: OWNER.phone,
      location: OWNER.location
    }
  );
  return { id: result.insertId, created: true };
}

async function ensureProperty(conn, ownerId) {
  const [rows] = await conn.execute(
    'SELECT id FROM properties WHERE owner_id = :owner_id ORDER BY id LIMIT 1',
    { owner_id: ownerId }
  );
  if (rows.length > 0) {
    return { id: rows[0].id, created: false };
  }

  const [result] = await conn.execute(
    `INSERT INTO properties (
      owner_id, name, description, location, address, price_per_night,
      bedrooms, bathrooms, max_guests, beds, property_type, privacy_type
    ) VALUES (
      :owner_id, :name, :description, :location, :address, :price_per_night,
      :bedrooms, :bathrooms, :max_guests, :beds, :property_type, :privacy_type
    )`,
    {
      owner_id: ownerId,
      name: PROPERTY.name,
      description: PROPERTY.description,
      location: PROPERTY.location,
      address: PROPERTY.address,
      price_per_night: PROPERTY.price_per_night,
      bedrooms: PROPERTY.bedrooms,
      bathrooms: PROPERTY.bathrooms,
      max_guests: PROPERTY.max_guests,
      beds: PROPERTY.beds,
      property_type: PROPERTY.property_type,
      privacy_type: PROPERTY.privacy_type
    }
  );

  return { id: result.insertId, created: true };
}

async function ensureTraveler(conn, traveler) {
  const [rows] = await conn.execute(
    'SELECT id FROM users WHERE email = :email LIMIT 1',
    { email: traveler.email }
  );
  if (rows.length > 0) {
    return { id: rows[0].id, created: false };
  }

  const passwordHash = await bcrypt.hash('Traveler123!', 10);
  const [result] = await conn.execute(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (:name, :email, :password_hash, 'TRAVELER')`,
    { name: traveler.name, email: traveler.email, password_hash: passwordHash }
  );
  return { id: result.insertId, created: true };
}

async function ensureBooking(conn, supportsTravelerAccounts, propertyId, booking) {
  const [existing] = await conn.execute(
    `SELECT id FROM bookings
      WHERE property_id = :propertyId
        AND traveler_email = :travelerEmail
        AND status = :status
      LIMIT 1`,
    {
      propertyId,
      travelerEmail: booking.travelerEmail,
      status: booking.status
    }
  );

  const payload = {
    propertyId,
    travelerName: booking.travelerName,
    travelerEmail: booking.travelerEmail,
    startDate: makeDate(booking.startOffset),
    endDate: makeDate(booking.endOffset),
    guests: booking.guests,
    status: booking.status,
    createdAt: makeTimestamp(booking.createdOffset)
  };

  if (supportsTravelerAccounts && booking.travelerId) {
    payload.travelerId = booking.travelerId;
  }

  if (existing.length > 0) {
    const updateSql = supportsTravelerAccounts && booking.travelerId
      ? `UPDATE bookings SET
            traveler_id = :travelerId,
            traveler_name = :travelerName,
            traveler_email = :travelerEmail,
            start_date = :startDate,
            end_date = :endDate,
            guests = :guests,
            status = :status
          WHERE id = :id`
      : `UPDATE bookings SET
            traveler_name = :travelerName,
            traveler_email = :travelerEmail,
            start_date = :startDate,
            end_date = :endDate,
            guests = :guests,
            status = :status
          WHERE id = :id`;

    await conn.execute(updateSql, { ...payload, id: existing[0].id });
    return { id: existing[0].id, created: false };
  }

  const insertSql = supportsTravelerAccounts && booking.travelerId
    ? `INSERT INTO bookings (
          property_id, traveler_id, traveler_name, traveler_email,
          start_date, end_date, guests, status, created_at
        ) VALUES (
          :propertyId, :travelerId, :travelerName, :travelerEmail,
          :startDate, :endDate, :guests, :status, :createdAt
        )`
    : `INSERT INTO bookings (
          property_id, traveler_name, traveler_email,
          start_date, end_date, guests, status, created_at
        ) VALUES (
          :propertyId, :travelerName, :travelerEmail,
          :startDate, :endDate, :guests, :status, :createdAt
        )`;

  const [result] = await conn.execute(insertSql, payload);
  return { id: result.insertId, created: true };
}

async function seedDemoData() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const supportsTravelerAccounts = await hasTravelerColumn(conn);

    const owner = await ensureOwner(conn);
    const property = await ensureProperty(conn, owner.id);

    const summary = {
      ownerCreated: owner.created,
      propertyCreated: property.created,
      bookings: []
    };

    for (const booking of BOOKINGS) {
      let travelerId = null;
      if (supportsTravelerAccounts) {
        const traveler = await ensureTraveler(conn, {
          name: booking.travelerName,
          email: booking.travelerEmail
        });
        travelerId = traveler.id;
        booking.travelerId = travelerId;
      }

      const result = await ensureBooking(conn, supportsTravelerAccounts, property.id, {
        ...booking,
        travelerId
      });

      summary.bookings.push({ status: booking.status, created: result.created });
    }

    await conn.commit();

    console.log('Seed task completed.');
    console.log(` - Host ${owner.created ? 'created' : 'reused'} (${OWNER.email})`);
    console.log(` - Property ${property.created ? 'created' : 'reused'} (id ${property.id})`);

    if (BOOKINGS.length > 0) {
      const perStatus = BOOKINGS.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      const createdByStatus = summary.bookings.reduce((acc, entry) => {
        if (!entry.created) return acc;
        acc[entry.status] = (acc[entry.status] || 0) + 1;
        return acc;
      }, {});
      Object.entries(perStatus).forEach(([status, count]) => {
        const touched = summary.bookings.filter((entry) => entry.status === status).length;
        const created = createdByStatus[status] || 0;
        const updated = Math.max(touched - created, 0);
        console.log(` - ${status} bookings requested: ${count}, created: ${created}, updated: ${updated}`);
      });
    } else {
      console.log(' - No bookings requested via CLI flags.');
    }

    if (owner.created) {
      console.log('\nUse these host credentials to log in:');
      console.log(`   Email:    ${OWNER.email}`);
      console.log(`   Password: ${OWNER.password}`);
    }
  } catch (err) {
    await conn.rollback();
    console.error('Failed to seed demo bookings:', err);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
  }
}

seedDemoData();
