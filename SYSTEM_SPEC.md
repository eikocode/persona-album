# Photo Colorization Dashboard - System Specification

## Overview

A web-based dashboard that allows users to upload grayscale/black-and-white photos and colorize them using a drag-and-drop interface.

---

## Features

### 1. Photo Upload
- Support for common image formats: JPEG, PNG, WebP
- Maximum file size: 10MB per image
- Drag-and-drop upload zone
- Click-to-browse file selection
- Multiple file upload support
- Upload progress indicator

### 2. Photo Gallery
- Grid view of uploaded photos
- Thumbnail preview for each photo
- Photo metadata display (filename, size, upload date)
- Delete option for each photo

### 3. Colorization Workflow
- **Drop Zone**: Dedicated area to drop photos for colorization
- Drag photos from gallery to colorization zone
- Processing indicator during colorization
- Side-by-side preview (original vs colorized)
- Download colorized result

---

## User Interface

```
+--------------------------------------------------+
|  Photo Colorization Dashboard            [User]  |
+--------------------------------------------------+
|                                                  |
|  +--------------------+  +--------------------+  |
|  |   Upload Zone      |  |  Colorization Zone |  |
|  |                    |  |                    |  |
|  |  [Drag photos or   |  |  [Drop photo here  |  |
|  |   click to browse] |  |   to colorize]     |  |
|  |                    |  |                    |  |
|  +--------------------+  +--------------------+  |
|                                                  |
|  Photo Gallery                                   |
|  +------+ +------+ +------+ +------+ +------+   |
|  | img1 | | img2 | | img3 | | img4 | | img5 |   |
|  +------+ +------+ +------+ +------+ +------+   |
|                                                  |
|  Colorization Results                            |
|  +---------------------+  +------------------+   |
|  | Original            |  | Colorized        |   |
|  |                     |  |                  |   |
|  |                     |  |        [Download]|   |
|  +---------------------+  +------------------+   |
|                                                  |
+--------------------------------------------------+
```

---

## Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router) with React and TypeScript
- **Styling**: Tailwind CSS
- **Drag & Drop**: react-dropzone + native HTML5 DnD API
- **State Management**: React useState/useEffect hooks
- **Supabase Client**: `@supabase/supabase-js` for direct client-side access

### Backend (Supabase)
- **Platform**: Supabase (Backend-as-a-Service)
- **Database**: Supabase Postgres for photo metadata and colorization job tracking
- **File Storage**: Supabase Storage for uploaded and colorized images
- **API Layer**: Next.js API routes as a thin proxy layer; Supabase handles persistence
- **Image Processing**: Sharp (for resizing/optimization before upload)

### Colorization Engine
- **Primary**: Nano Banana (Gemini) AI colorization API
- **Fallback**: Mock colorization (when no API key is configured)

### Supabase Services Used
| Service | Purpose |
|---------|---------|
| **Storage** | Store original and colorized photo files in buckets |
| **Database (Postgres)** | Store photo metadata, colorization jobs, and relationships |
| **Realtime** (future) | Live updates for colorization job progress |
| **Auth** (future) | User accounts and personal galleries |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload photo → Supabase Storage + insert metadata to Postgres |
| GET | `/api/photos` | Query photo metadata from Supabase Postgres |
| GET | `/api/photos/:id` | Get single photo details from Supabase Postgres |
| DELETE | `/api/photos/:id` | Delete photo from Supabase Storage + Postgres |
| POST | `/api/colorize` | Submit photo for colorization, store result in Supabase |
| GET | `/api/colorize/:id` | Get colorization result from Supabase |

---

## Supabase Schema

### Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `photos` | Private | Original uploaded photos |
| `colorized` | Private | Colorized photo results |

Files are accessed via signed URLs generated server-side.

### Database Tables

#### `photos`
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  is_colorized BOOLEAN DEFAULT FALSE,
  original_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `colorization_jobs`
```sql
CREATE TABLE colorization_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

## Data Models (TypeScript)

### Photo
```typescript
interface Photo {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  storage_path: string;
  url: string;
  is_colorized: boolean;
  original_id: string | null;
  created_at: string;
}
```

### ColorizationJob
```typescript
interface ColorizationJob {
  id: string;
  photo_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_photo_id: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GEMINI_API_KEY=<gemini-api-key>
```

---

## User Flow

1. User opens dashboard
2. User uploads grayscale photos (drag or click)
3. Photos appear in gallery with thumbnails
4. User drags a photo from gallery to colorization zone
5. System processes the image (shows loading state)
6. Colorized result appears in comparison view
7. User downloads or discards the result

---

## Non-Functional Requirements

- **Performance**: Colorization should complete within 30 seconds
- **Responsiveness**: UI should work on desktop and tablet
- **Browser Support**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Accessibility**: Basic keyboard navigation and screen reader support

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                  Browser (Client)                │
│  Next.js App (React + TypeScript + Tailwind)     │
│  ┌──────────┐ ┌───────────┐ ┌────────────────┐  │
│  │UploadZone│ │PhotoGallery│ │ ColorizeZone   │  │
│  └────┬─────┘ └─────┬─────┘ └───────┬────────┘  │
└───────┼─────────────┼───────────────┼────────────┘
        │             │               │
        ▼             ▼               ▼
┌─────────────────────────────────────────────────┐
│              Next.js API Routes                  │
│  /api/upload  /api/photos  /api/colorize         │
│         │           │            │               │
└─────────┼───────────┼────────────┼───────────────┘
          │           │            │
          ▼           ▼            ▼
┌─────────────────────────────────────────────────┐
│                  Supabase                        │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │   Storage    │  │     Postgres Database     │  │
│  │ ┌─────────┐ │  │  ┌────────┐ ┌──────────┐ │  │
│  │ │ photos  │ │  │  │ photos │ │colorize_ │ │  │
│  │ ├─────────┤ │  │  │        │ │  jobs    │ │  │
│  │ │colorized│ │  │  └────────┘ └──────────┘ │  │
│  │ └─────────┘ │  │                          │  │
│  └─────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│  Gemini AI API      │
│  (Colorization)     │
└─────────────────────┘
```

---

## Migration Notes (from local filesystem)

The current implementation uses:
- Local filesystem (`public/uploads/`) for photo storage
- In-memory/filesystem metadata (no database)

Migration to Supabase requires:
1. Replace `lib/storage.ts` to use Supabase Storage + Postgres instead of local fs
2. Create Supabase client utility (`lib/supabase.ts`)
3. Update API routes to read/write from Supabase
4. Create storage buckets and database tables in Supabase project
5. Update photo URLs from local paths to Supabase signed URLs
6. Add environment variables for Supabase credentials

---

## Future Enhancements (Out of Scope)

- User authentication via Supabase Auth and personal galleries
- Batch colorization
- Colorization style presets
- History of colorized images with Supabase Realtime updates
- Social sharing
- Row Level Security (RLS) policies for multi-user access
