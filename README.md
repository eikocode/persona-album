# Photo Colorization Dashboard

A web-based dashboard that allows users to upload grayscale/black-and-white photos and colorize them using a drag-and-drop interface.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Then open http://localhost:3000

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
- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Drag & Drop**: react-dropzone + native HTML5 DnD API

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API routes
- **File Storage**: Local filesystem (`public/uploads/`)
- **Image Processing**: Sharp

### Colorization Engine
- Mock implementation using Sharp (sepia/warm tint effect)
- Easy to replace with real AI API later

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload one or more photos |
| GET | `/api/photos` | List all uploaded photos |
| GET | `/api/photos/:id` | Get single photo details |
| DELETE | `/api/photos/:id` | Delete a photo |
| POST | `/api/colorize` | Submit photo for colorization |

---

## Data Models

### Photo
```typescript
interface Photo {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  createdAt: string;
  isColorized: boolean;
  originalId?: string;
}
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

## Future Enhancements

- User authentication and personal galleries
- Batch colorization
- Colorization style presets
- History of colorized images
- Social sharing
- Real AI colorization API integration
