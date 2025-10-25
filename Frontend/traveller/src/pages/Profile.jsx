import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { travelerAPI } from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const { traveler, isAuthenticated, updateTraveler } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    about_me: '',
    city: '',
    state: '',
    country: '',
    languages: [],
    gender: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, navigate]);

  const normalizeProfile = (data) => ({
    ...data,
    about_me: data.about ?? '',
    state: data.state_abbr ?? '',
    profile_picture: data.profile_image_url ?? '',
    languages: Array.isArray(data.languages)
      ? data.languages
      : data.languages
      ? data.languages.split(',').map((l) => l.trim())
      : [],
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      try {
        console.log('Attempting to load profile from database...');
        const response = await travelerAPI.getProfile();
        console.log('Database response:', response.data);
        const travelerData = response.data.traveler;
        
        const normalized = normalizeProfile(travelerData);
        setProfile(normalized);
        setFormData({
          name: normalized.name || '',
          phone: normalized.phone || '',
          about_me: normalized.about_me || '',
          city: normalized.city || '',
          state: normalized.state || '',
          country: normalized.country || '',
          languages: normalized.languages || [],
          gender: normalized.gender || ''
        });
        console.log('Profile loaded from database successfully');
        return;
      } catch (dbError) {
        console.log('Database not available, using localStorage fallback:', dbError.message);
        console.log('Full error:', dbError);
      }
      
      const storedProfile = JSON.parse(localStorage.getItem('travelerProfile') || '{}');
      const normalized = normalizeProfile({
        ...traveler,
        ...storedProfile
      });

      setProfile(normalized);
      setFormData({
        name: normalized.name || '',
        phone: normalized.phone || '',
        about_me: normalized.about_me || '',
        city: normalized.city || '',
        state: normalized.state || '',
        country: normalized.country || '',
        languages: normalized.languages || [],
        gender: normalized.gender || ''
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLanguageChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      languages: checked
        ? [...prev.languages, value]
        : prev.languages.filter((lang) => lang !== value)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      try {
        console.log('Attempting to update profile in database...');
        const updateData = {};
        if (formData.name) updateData.name = formData.name;
        if (formData.phone) updateData.phone = formData.phone;
        if (formData.about_me) updateData.about_me = formData.about_me;
        if (formData.city) updateData.city = formData.city;
        if (formData.state) updateData.state = formData.state;
        if (formData.country) updateData.country = formData.country;
        if (formData.languages && formData.languages.length > 0) updateData.languages = formData.languages;
        if (formData.gender) updateData.gender = formData.gender;

        console.log('Update data:', updateData);
        const response = await travelerAPI.updateProfile(updateData);
        console.log('Database update response:', response.data);
        const updatedTraveler = response.data.traveler;

        const normalized = normalizeProfile(updatedTraveler);
        setProfile(normalized);
        updateTraveler({
          id: traveler.id,
          email: traveler.email,
          name: formData.name,
          profile_image_url: normalized.profile_picture
        });

        setEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        console.log('Profile updated in database successfully');
        return;
      } catch (dbError) {
        console.log('Database not available, using localStorage fallback:', dbError.message);
        console.log('Full error:', dbError);
      }

      const updatedProfile = {
        ...profile,
        ...formData,
        about: formData.about_me,
        state_abbr: formData.state,
        profile_image_url: profile.profile_picture
      };

      localStorage.setItem('travelerProfile', JSON.stringify(updatedProfile));

      setProfile(updatedProfile);
      updateTraveler({
        id: traveler.id,
        email: traveler.email,
        name: formData.name,
        profile_image_url: profile.profile_picture
      });

      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    try {
      setSaving(true);
      
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await travelerAPI.uploadProfilePicture(formData);
      const imageUrl = response.data.profile_picture;
      
      const updatedProfile = {
        ...profile,
        profile_picture: imageUrl,
        profile_image_url: imageUrl
      };
      
      setProfile(updatedProfile);
      updateTraveler({ ...traveler, profile_image_url: imageUrl });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to upload image');
      console.error('Error uploading image:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      await travelerAPI.updateProfile({ profile_picture: null });
      
      const updatedProfile = {
        ...profile,
        profile_picture: null,
        profile_image_url: null
      };
      setProfile(updatedProfile);
      updateTraveler({ ...traveler, profile_image_url: null });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to delete image');
      console.error('Error deleting image:', err);
    }
  };

  const countries = [
    'United States', 'Canada', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain',
    'Australia', 'Japan', 'South Korea', 'China', 'India', 'Brazil', 'Mexico', 'Argentina'
  ];

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Norwegian'
  ];

  const genders = [
    { value: '', label: 'Prefer not to say' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1 className="profile-title">Profile</h1>
          <p className="profile-subtitle">Manage your account information</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">Profile updated successfully!</div>}

        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-image-section">
              <div className="profile-image-container">
                {profile.profile_picture ? (
                  <img src={profile.profile_picture} alt="Profile" className="profile-image" />
                ) : (
                  <div className="profile-image-placeholder">
                    <span className="placeholder-text">{profile.name?.charAt(0) || 'U'}</span>
                  </div>
                )}
              </div>

              <div className="image-upload">
                <input
                  type="file"
                  id="profile-image"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                  disabled={saving}
                />
                <div className="image-buttons">
                  <label htmlFor="profile-image" className="upload-button">
                    {saving ? 'Uploading...' : 'Change Photo'}
                  </label>
                  {profile.profile_picture && (
                    <button 
                      type="button" 
                      className="delete-button"
                      onClick={handleDeleteImage}
                      disabled={saving}
                    >
                      Delete Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-form-section">
              {editing ? (
                <form onSubmit={handleSubmit} className="profile-form">
                  {/* Name + Phone */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        name="name"
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                      />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">About me</label>
                    <textarea
                      name="about_me"
                      className="form-control"
                      rows="4"
                      value={formData.about_me}
                      onChange={handleChange}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input
                        type="text"
                        name="city"
                        className="form-control"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="New York"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input
                        type="text"
                        name="state"
                        className="form-control"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="NY"
                        maxLength="10"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <select
                        name="country"
                        className="form-control"
                        value={formData.country}
                        onChange={handleChange}
                      >
                        <option value="">Select country</option>
                        {countries.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select
                        name="gender"
                        className="form-control"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        {genders.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>


                  <div className="form-group">
                    <label className="form-label">Languages</label>
                    <div className="languages-grid">
                      {languages.map((lang) => (
                        <label key={lang} className="language-checkbox">
                          <input
                            type="checkbox"
                            value={lang}
                            checked={formData.languages.includes(lang)}
                            onChange={handleLanguageChange}
                          />
                          <span className="checkbox-text">{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn btn-outline" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-display">
                  <div className="profile-info">
                    <h2 className="profile-name">{profile.name}</h2>
                    <p className="profile-email">{profile.email}</p>
                    {profile.phone && <p><span className="detail-label">Phone:</span>{profile.phone}</p>}
                    {profile.about_me && <p><span className="detail-label">About:</span>{profile.about_me}</p>}
                    {(profile.city || profile.state || profile.country) && (
                      <p>
                        <span className="detail-label">Location:</span>
                        {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {profile.languages?.length > 0 && (
                      <p><span className="detail-label">Languages:</span>{profile.languages.join(', ')}</p>
                    )}
                    {profile.gender && (
                      <p><span className="detail-label">Gender:</span>{profile.gender}</p>
                    )}
                  </div>
                  <button className="btn btn-primary" onClick={() => setEditing(true)}>Edit Profile</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-image-container {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 20px;
          border: 3px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
        }

        .profile-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        .profile-image-placeholder {
          width: 100%;
          height: 100%;
          background: #FF385C;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .placeholder-text {
          color: white;
          font-size: 48px;
          font-weight: 600;
        }

        .image-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        .upload-button {
          display: inline-block;
          background: #FF385C;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 14px;
        }

        .upload-button:hover {
          background: #E31C5F;
          transform: translateY(-1px);
        }

        .upload-button:active {
          transform: translateY(0);
        }

        .delete-button {
          background: #6c757d;
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }

        .delete-button:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }

        .delete-button:active {
          transform: translateY(0);
        }

        .delete-button:disabled {
          background: #adb5bd;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
};

export default Profile;
