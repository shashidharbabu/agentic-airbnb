import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import '../styles/Listings.css';
import { currencyFormatter, transformProperty as transformListingProperty } from '../utils/listings';

const statusFilters = [
  { key: 'all', label: 'All listings' },
  { key: 'draft', label: 'Drafts' },
  { key: 'snoozed', label: 'Snoozed' },
  { key: 'inactive', label: 'Inactive' }
];

const filterEmptyMessages = {
  draft: "You don't have any drafts yet.",
  snoozed: "You don't have snoozed listings right now.",
  inactive: "No inactive listings at the moment."
};

const viewIcons = {
  grid: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1.5" ry="1.5" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" ry="1.5" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" ry="1.5" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" ry="1.5" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5 17.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  )
};

export default function Listings() {
  const navigate = useNavigate();
  const isMountedRef = useRef(false);
  const [listings, setListings] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const apiBase = useMemo(() => {
    const baseValue = api.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : '');
    return baseValue.endsWith('/') ? baseValue.slice(0, -1) : baseValue;
  }, []);

  const transformProperty = useCallback(
    (property, index) => transformListingProperty(property, index, apiBase),
    [apiBase]
  );

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/properties/mine');
      const properties = Array.isArray(data?.properties) ? data.properties : [];
      const mapped = properties
        .map((property, index) => transformProperty(property, index))
        .filter(Boolean);
      if (isMountedRef.current) {
        setListings(mapped);
      }
    } catch (err) {
      const message =
        err?.response?.data?.error === 'unauthorized'
          ? 'You must be signed in to view your listings.'
          : 'We could not load your listings right now.';
      if (isMountedRef.current) setError(message);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [transformProperty]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const filteredListings = useMemo(() => {
    if (statusFilter === 'all') return listings;
    return listings.filter((listing) => listing.statusKey === statusFilter);
  }, [listings, statusFilter]);

  const summary = useMemo(() => {
    const totals = { total: listings.length, live: 0, snoozed: 0, inactive: 0, draft: 0 };
    for (const listing of listings) {
      const key = listing.statusKey;
      if (Object.prototype.hasOwnProperty.call(totals, key)) totals[key] += 1;
    }
    return totals;
  }, [listings]);

  const summaryParts = useMemo(() => {
    const parts = [];
    if (summary.live) parts.push(`${summary.live} live`);
    if (summary.snoozed) parts.push(`${summary.snoozed} snoozed`);
    if (summary.inactive) parts.push(`${summary.inactive} inactive`);
    if (summary.draft) parts.push(`${summary.draft} drafts`);
    return parts;
  }, [summary]);

  let content;
  if (loading) {
    content = (
      <div className="listings-page__empty">
        <strong>Loading your listings…</strong>
        <span>Hang tight while we fetch your stays.</span>
      </div>
    );
  } else if (error) {
    content = (
      <div className="listings-page__empty listings-page__empty--error">
        <strong>{error}</strong>
        <button className="outline-button" type="button" onClick={loadListings}>
          Retry
        </button>
      </div>
    );
  } else if (!filteredListings.length) {
    const title =
      statusFilter === 'all'
        ? 'You have no listings yet.'
        : filterEmptyMessages[statusFilter] || 'No listings match this filter.';
    const subtitle =
      statusFilter === 'all'
        ? 'Create your first stay to start hosting.'
        : 'Adjust your filter or create a new listing.';
    content = (
      <div className="listings-page__empty">
        <strong>{title}</strong>
        <span>{subtitle}</span>
        <button className="outline-button" type="button" onClick={() => navigate('/onboarding/type')}>
          Create a listing
        </button>
      </div>
    );
  } else if (viewMode === 'grid') {
    content = (
      <div className="listings-page__grid">
        {filteredListings.map((listing) => {
          const ratingLabel = listing.rating !== null && listing.rating !== undefined ? listing.rating.toFixed(2) : '—';
          const reviewsLabel = typeof listing.reviews === 'number' ? listing.reviews.toLocaleString('en-US') : '—';
          const viewsLabel = typeof listing.views === 'number' ? listing.views.toLocaleString('en-US') : '—';
          const priceLabel =
            listing.price !== null && listing.price !== undefined
              ? currencyFormatter.format(listing.price)
              : '—';

          return (
            <article key={listing.id} className="listing-card">
              <div className="listing-card__media" style={{ backgroundImage: `url(${listing.image})` }}>
                <div className="listing-card__pill listing-card__pill--status">
                  <span aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="m5.25 12 4.5 4.5 9-9" />
                    </svg>
                  </span>
                  {listing.status}
                </div>
                <button
                  className="listing-card__pill listing-card__pill--light"
                  type="button"
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  Preview
                </button>
              </div>

              <div className="listing-card__body">
                <div className="listing-card__header">
                  <div>
                    <h2>{listing.title}</h2>
                    <span>{listing.location}</span>
                  </div>
                  <button className="icon-button" aria-label="Open quick actions" type="button">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                </div>

                <div className="listing-card__metrics">
                  <div className="metric">
                    <span className="metric__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 2.25 14.7 8.4l6.3.45-4.8 4.05 1.5 6.15L12 15.9 6.3 19.05l1.5-6.15-4.8-4.05 6.3-.45Z" />
                      </svg>
                    </span>
                    <div>
                      <strong>{ratingLabel}</strong>
                      <span>Guest rating</span>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M7.5 21.75h9" />
                        <path d="M5.25 7.5h13.5" />
                        <path d="M6.75 7.5v-3h10.5v3" />
                        <path d="M9 7.5v14.25" />
                        <path d="M15 7.5v14.25" />
                      </svg>
                    </span>
                    <div>
                      <strong>{reviewsLabel}</strong>
                      <span>Total reviews</span>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M3.75 12c0-4.556 3.694-8.25 8.25-8.25S20.25 7.444 20.25 12 16.556 20.25 12 20.25 3.75 16.556 3.75 12Z" />
                        <path d="m9.75 10.5 2.25 2.25 5.25-5.25" />
                      </svg>
                    </span>
                    <div>
                      <strong>{viewsLabel}</strong>
                      <span>Views (90 days)</span>
                    </div>
                  </div>
                  <div className="metric">
                    <span className="metric__icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M3.75 7.5h16.5" />
                        <path d="M7.5 7.5v-3h9v3" />
                        <path d="M6.75 7.5v12.75" />
                        <path d="M17.25 7.5v12.75" />
                        <path d="M6.75 15.75h10.5" />
                      </svg>
                    </span>
                    <div>
                      <strong>{priceLabel}</strong>
                      <span>Average nightly price</span>
                    </div>
                  </div>
                </div>

                <div className="listing-card__footer">
                  <button className="outline-button" type="button" onClick={() => navigate(`/host/listings/${listing.id}/details`)}>
                    Listing details
                  </button>
                  <button className="outline-button" type="button" onClick={() => navigate(`/host/listings/${listing.id}/pricing`)}>
                    Pricing &amp; availability
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  } else {
    content = (
      <div className="listings-table">
        <div className="listings-table__header">
          <span>Listing</span>
          <span>Type</span>
          <span>Location</span>
          <span>Status</span>
        </div>
        <div className="listings-table__body">
          {filteredListings.map((listing) => {
            const statusDotClass =
              listing.status === 'Live'
                ? 'status-dot status-dot--success'
                : listing.status === 'Snoozed'
                ? 'status-dot status-dot--snoozed'
                : 'status-dot status-dot--neutral';

            return (
              <div key={listing.id} className="listings-table__row">
                <div className="listings-table__cell listings-table__cell--listing">
                  <div className="listings-table__thumb" style={{ backgroundImage: `url(${listing.image})` }} />
                  <div>
                    <strong>{listing.title}</strong>
                    <span>{listing.location}</span>
                  </div>
                </div>
                <div className="listings-table__cell">{listing.propertyType}</div>
                <div className="listings-table__cell">{listing.fullLocation}</div>
                <div className="listings-table__cell listings-table__cell--status">
                  <span className={statusDotClass} />
                  {listing.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="listings-page">
      <div className="listings-page__header">
        <div>
          <h1>Your listings</h1>
          <p>Manage your active listings, drafts, and snoozed stays.</p>
        </div>
      </div>

      <div className="listings-page__toolbar">
        <div className="listings-page__tabs">
          {statusFilters.map(({ key, label }) => (
            <button
              key={key}
              className={`tab-button ${statusFilter === key ? 'tab-button--active' : ''}`}
              type="button"
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="listings-page__actions">
          <button
            className={`icon-chip ${viewMode === 'list' ? 'icon-chip--active' : ''}`}
            onClick={() => setViewMode((mode) => (mode === 'grid' ? 'list' : 'grid'))}
            aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
            type="button"
          >
            {viewMode === 'grid' ? viewIcons.list : viewIcons.grid}
          </button>
          <button
            className="icon-chip icon-chip--primary"
            onClick={() => navigate('/onboarding/type')}
            aria-label="Add new listing"
            type="button"
          >
            {viewIcons.plus}
          </button>
        </div>
      </div>

      {!loading && !error && (
        <div className="listings-page__summary">
          <div>
            <strong>
              {summary.total} {summary.total === 1 ? 'listing' : 'listings'}
            </strong>
            {summaryParts.length > 0 && <span>• {summaryParts.join(' • ')}</span>}
          </div>
          {summary.total > 0 && (
            <button className="inline-button" type="button">
              Download performance data
            </button>
          )}
        </div>
      )}

      {content}
    </div>
  );
}
