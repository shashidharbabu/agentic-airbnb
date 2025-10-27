# Host Profile Picture Upload Implementation

**Date:** October 27, 2025  
**Status:** ✅ Complete

## Summary

Implemented full profile picture upload, display, and delete functionality for the host profile page, matching the traveller side's functionality.

---

## Backend Changes

### 1. **Updated Upload Middleware** (`backend/host/src/middleware/upload.js`)

- Created separate storage configurations for property photos and profile pictures
- Added `uploadProfilePicture` multer instance with:
  - Dedicated directory: `uploads/profile-pictures/`
  - File size limit: 5MB
  - File type validation: JPEG, JPG, PNG, GIF, WebP
  - Filename prefix: `profile-{uuid}.{ext}`

### 2. **Updated Auth Routes** (`backend/host/src/routes/auth.js`)

Added three new endpoints:

#### **GET `/auth/me`** (Enhanced)
- Now fetches and returns `avatar_url` from the database
- Returns full owner object including profile picture URL

#### **POST `/auth/profile/picture`**
- Accepts file upload via `FormData` with field name `avatar`
- Validates file type and size
- Stores file in `uploads/profile-pictures/`
- Updates `owners.avatar_url` in the database
- Returns the new avatar URL path

#### **DELETE `/auth/profile/picture`**
- Sets `owners.avatar_url` to `NULL` in the database
- Updates the session to reflect the change

#### **PUT `/auth/profile`** (Enhanced)
- Now fetches and returns `avatar_url` in the response
- Ensures session always has the latest avatar URL

---

## Frontend Changes

### **Updated Host Profile Component** (`frontend/host/src/pages/HostProfile.jsx`)

#### **New State Variables**
- `uploadingAvatar`: Loading state during upload/delete
- `avatarError`: Error messages for upload/delete operations

#### **New Functions**

##### `handleAvatarUpload(event)`
- Validates file type (JPEG, PNG, GIF, WebP)
- Validates file size (max 5MB)
- Creates `FormData` and uploads to `POST /auth/profile/picture`
- Refreshes auth context to update UI
- Shows error messages if validation or upload fails

##### `handleAvatarDelete()`
- Confirms with user before deletion
- Sends `DELETE /auth/profile/picture`
- Refreshes auth context to update UI
- Shows error messages if deletion fails

#### **UI Updates**

1. **Profile Picture Display**
   - Shows uploaded avatar image when available
   - Falls back to initial letter circle when no avatar
   - Image is displayed at 180x180px, circular, with proper object-fit

2. **Upload Controls**
   - Hidden file input with `accept` attribute for image types
   - Styled label button that says "Add" (no avatar) or "Change" (has avatar)
   - Shows "Uploading..." state during upload
   - Disabled during upload operations

3. **Delete Button**
   - Only visible when an avatar exists
   - Red-styled button for destructive action
   - Confirms before deletion
   - Disabled during upload operations

4. **Error Display**
   - Shows validation errors (file type, file size)
   - Shows API errors (upload failed, delete failed)
   - Styled in red with proper padding and border-radius

---

## Database Schema

The `owners` table already had the `avatar_url` column:

```sql
CREATE TABLE owners (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  location VARCHAR(255),
  phone VARCHAR(50),
  about TEXT,
  avatar_url VARCHAR(512),  -- ✅ Already exists
  -- ... other fields
);
```

No database migrations were needed.

---

## File Structure

```
backend/host/
├── uploads/
│   ├── profile-pictures/     ← New directory (auto-created)
│   │   └── profile-{uuid}.jpg
│   └── property-photos/
│       └── {uuid}.jpg
├── src/
│   ├── middleware/
│   │   └── upload.js          ← Updated (added uploadProfilePicture)
│   └── routes/
│       └── auth.js            ← Updated (added 2 endpoints, enhanced 2)

frontend/host/
└── src/
    └── pages/
        └── HostProfile.jsx    ← Updated (added upload/delete UI)
```

---

## How It Works

### **Upload Flow**
1. User clicks "Add" or "Change" button
2. File picker opens (filtered to images only)
3. Frontend validates file type and size
4. FormData is created and sent to backend
5. Backend validates again, saves file, updates DB
6. Frontend refreshes auth context
7. UI updates to show new avatar

### **Delete Flow**
1. User clicks "Delete" button
2. Confirmation dialog appears
3. DELETE request sent to backend
4. Backend sets `avatar_url` to NULL
5. Frontend refreshes auth context
6. UI reverts to initial letter circle

---

## Image URL Format

- **Stored in DB**: `/uploads/profile-pictures/profile-abc123.jpg`
- **Accessed via**: `http://localhost:4000/uploads/profile-pictures/profile-abc123.jpg`
- **Frontend displays**: `http://localhost:4000${avatar_url}`

The host backend already serves static files from the `uploads` directory via Express.

---

## Testing Checklist

✅ Upload valid image (JPEG, PNG, GIF, WebP)  
✅ Upload displays immediately after upload  
✅ "Add" button changes to "Change" after upload  
✅ "Delete" button appears after upload  
✅ Delete removes image and shows initial circle  
✅ File type validation (reject .txt, .pdf, etc.)  
✅ File size validation (reject files > 5MB)  
✅ Error messages display correctly  
✅ Upload state shows "Uploading..." during process  
✅ Avatar persists after page refresh  

---

## Key Features

✨ **Seamless UX**: Upload button becomes a label, no explicit "Upload" needed  
✨ **Validation**: Both client-side and server-side validation  
✨ **Error Handling**: Clear error messages for all failure cases  
✨ **Loading States**: Disabled buttons and "Uploading..." text during operations  
✨ **Confirmation**: Delete requires user confirmation  
✨ **Auto-refresh**: Auth context refreshes automatically after upload/delete  
✨ **Fallback**: Shows initial letter when no avatar is set  

---

## Comparison with Traveller Side

| Feature | Traveller (`Profile.jsx`) | Host (`HostProfile.jsx`) |
|---------|---------------------------|--------------------------|
| Upload Endpoint | ✅ `POST /profile/picture` | ✅ `POST /auth/profile/picture` |
| Delete Endpoint | ✅ (via update) | ✅ `DELETE /auth/profile/picture` |
| File Validation | ✅ Client & Server | ✅ Client & Server |
| Size Limit | 5MB | 5MB |
| Allowed Types | JPEG, PNG, GIF, WebP | JPEG, PNG, GIF, WebP |
| Storage Location | `backend/traveller/uploads/` | `backend/host/uploads/profile-pictures/` |
| Database Column | `traveler_profiles.profile_image_url` | `owners.avatar_url` |
| UI Style | Form-based | Airbnb-styled inline |

---

## Next Steps (Optional Enhancements)

🔹 Image cropping before upload  
🔹 Image compression/optimization on backend  
🔹 Multiple image sizes (thumbnail, full)  
🔹 Drag-and-drop upload  
🔹 Progress bar for large uploads  

---

## Implementation Complete! 🎉

The host side now has full profile picture upload functionality matching the traveller side, with a clean Airbnb-style UI and robust error handling.

