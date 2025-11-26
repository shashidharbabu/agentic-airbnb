const express = require('express');
const Joi = require('joi');
const { ObjectId } = require('mongodb');
const { getDB } = require('../config/database-mongodb');
const { ensureAuth } = require('../middleware/auth');

const router = express.Router();
const PLACEHOLDER_PHOTO_PATH =
  process.env.DEFAULT_PROPERTY_PHOTO || '/uploads/property-photos/placeholder-house.jpg';

const addFavoriteSchema = Joi.object({
  property_id: Joi.alternatives().try(Joi.string(), Joi.number()).required()
});

router.post('/', ensureAuth, async (req, res) => {
  try {
    const { error, value } = addFavoriteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const travelerId = req.session.traveler.id;
    let propertyId;
    try {
      propertyId = new ObjectId(value.property_id);
    } catch {
      return res.status(400).json({ error: 'invalid_property_id' });
    }

    const db = await getDB();
    const propertiesCollection = db.collection('properties');
    const favoritesCollection = db.collection('favorites');

    const property = await propertiesCollection.findOne({ _id: propertyId });
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const existingFavorite = await favoritesCollection.findOne({
      traveler_id: new ObjectId(travelerId),
      property_id: propertyId
    });

    if (existingFavorite) {
      return res.status(409).json({ error: 'Property already in favorites' });
    }

    await favoritesCollection.insertOne({
      traveler_id: new ObjectId(travelerId),
      property_id: propertyId,
      created_at: new Date()
    });

    return res.status(201).json({
      message: 'Property added to favorites successfully',
      property_id: propertyId.toString()
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:propertyId', ensureAuth, async (req, res) => {
  try {
    const travelerId = req.session.traveler.id;
    let propertyId;
    try {
      propertyId = new ObjectId(req.params.propertyId);
    } catch {
      return res.status(400).json({ error: 'invalid_property_id' });
    }

    const db = await getDB();
    const favoritesCollection = db.collection('favorites');

    const existingFavorite = await favoritesCollection.findOne({
      traveler_id: new ObjectId(travelerId),
      property_id: propertyId
    });

    if (!existingFavorite) {
      return res.status(404).json({ error: 'Property not in favorites' });
    }

    await favoritesCollection.deleteOne({
      traveler_id: new ObjectId(travelerId),
      property_id: propertyId
    });

    return res.json({
      message: 'Property removed from favorites successfully',
      property_id: propertyId.toString()
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/traveler/:id', ensureAuth, async (req, res) => {
  try {
    const travelerId = req.params.id;
    const requestingTravelerId = req.session.traveler.id;

    if (travelerId !== requestingTravelerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const db = await getDB();
    const favoritesCollection = db.collection('favorites');
    const propertiesCollection = db.collection('properties');
    const ownersCollection = db.collection('owners');
    const propertyPhotosCollection = db.collection('property_photos');

    const total = await favoritesCollection.countDocuments({
      traveler_id: new ObjectId(travelerId)
    });

    const favorites = await favoritesCollection
      .aggregate([
        { $match: { traveler_id: new ObjectId(travelerId) } },
        {
          $lookup: {
            from: 'properties',
            localField: 'property_id',
            foreignField: '_id',
            as: 'property'
          }
        },
        { $unwind: '$property' },
        {
          $lookup: {
            from: 'owners',
            localField: 'property.owner_id',
            foreignField: '_id',
            as: 'owner'
          }
        },
        { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ])
      .toArray();

    // Fetch photos for each favorite
    const favoritesWithPhotos = await Promise.all(
      favorites.map(async (favorite) => {
        const photo = await propertyPhotosCollection.findOne(
          { property_id: favorite.property_id },
          { sort: { created_at: -1 } }
        );

        const amenities = Array.isArray(favorite.property.amenities)
          ? favorite.property.amenities
          : favorite.property.amenities
          ? (() => {
              try {
                return typeof favorite.property.amenities === 'string'
                  ? JSON.parse(favorite.property.amenities)
                  : [];
              } catch {
                return [];
              }
            })()
          : [];

        return {
          favorite_id: favorite._id.toString(),
          favorited_at: favorite.created_at,
          property_id: favorite.property_id.toString(),
          property_name: favorite.property.name,
          description: favorite.property.description,
          location: favorite.property.location,
          price_per_night: favorite.property.price_per_night,
          bedrooms: favorite.property.bedrooms,
          bathrooms: favorite.property.bathrooms,
          max_guests: favorite.property.max_guests,
          property_type: favorite.property.property_type,
          amenities: amenities,
          owner_name: favorite.owner?.name || null,
          main_photo: photo?.file_path || PLACEHOLDER_PHOTO_PATH
        };
      })
    );

    return res.json({
      favorites: favoritesWithPhotos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/check/:propertyId', ensureAuth, async (req, res) => {
  try {
    const travelerId = req.session.traveler.id;
    let propertyId;
    try {
      propertyId = new ObjectId(req.params.propertyId);
    } catch {
      return res.status(400).json({ error: 'invalid_property_id' });
    }

    const db = await getDB();
    const favoritesCollection = db.collection('favorites');

    const favorite = await favoritesCollection.findOne({
      traveler_id: new ObjectId(travelerId),
      property_id: propertyId
    });

    return res.json({
      is_favorited: !!favorite
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
