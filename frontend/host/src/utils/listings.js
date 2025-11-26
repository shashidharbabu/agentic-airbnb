export const fallbackImages = [
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80'
];

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

export const buildLocationString = (property) => {
  const parts = [];
  if (property?.city) parts.push(property.city);
  if (property?.state) parts.push(property.state);
  else if (property?.country) parts.push(property.country);
  if (parts.length) return parts.join(', ');
  if (property?.location) return property.location;
  if (property?.address) return property.address;
  return 'Location not set';
};

export const capitalizeStatus = (status) => {
  if (!status || typeof status !== 'string') return 'Live';
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

export const asNumberOrNull = (value) => {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const asNumberOrZero = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const resolveImagePath = (path, apiBase, index = 0) => {
  if (typeof path === 'string' && /^https?:\/\//i.test(path)) return path;
  if (typeof path === 'string' && path.length > 0) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${apiBase}${normalized}`;
  }
  return fallbackImages[index % fallbackImages.length];
};

export const transformProperty = (property, index, apiBase) => {
  if (!property) return null;
  const analytics = property.analytics || {};
  const status = capitalizeStatus(property.status);
  return {
    id: property.id,
    title: property.name || 'Untitled listing',
    location: buildLocationString(property),
    fullLocation: buildLocationString(property),
    propertyType: property.property_type || 'Not set',
    status,
    statusKey: status.toLowerCase(),
    price: asNumberOrNull(property.price_per_night),
    rating: asNumberOrNull(analytics.average_rating),
    reviews: asNumberOrZero(analytics.reviews_count),
    views: asNumberOrZero(analytics.views_last_90d),
    image: resolveImagePath(property.cover_photo_path, apiBase, index),
    raw: property
  };
};
