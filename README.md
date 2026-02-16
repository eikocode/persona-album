# Photo Colorization Dashboard

A full-stack web application that allows users to upload black & white photos and colorize them using AI. Features optional user authentication, cloud storage, and state-of-the-art AI colorization powered by DeOldify.

🌐 **Live Demo**: https://persona-album.vercel.app/

## ✨ Features

### 🎨 AI-Powered Colorization
- **DeOldify** colorization model via Replicate API
- High-quality "Artistic" mode for vibrant, realistic colors
- Processing time: ~30-60 seconds per image
- Automatic fallback to warm tint effect if API unavailable

### 🔐 Optional Authentication
- Email/password authentication via Supabase Auth
- User accounts with photo ownership tracking
- Anonymous uploads still supported
- Session persistence across page refreshes

### 📸 Photo Management
- Drag-and-drop or click-to-browse upload
- Support for JPEG, PNG, GIF, WebP (up to 10MB)
- Cloud storage with Supabase Storage
- Side-by-side comparison (original vs colorized)
- Delete and manage your photos

### 💻 Modern Stack
- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS for styling
- Supabase for backend (storage + database + auth)
- Deployed on Vercel

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works!)
- Replicate account with API token

### 1. Clone and Install

```bash
git clone https://github.com/eikocode/persona-album.git
cd persona-album
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Storage** → Create bucket named `photos` (make it public)
3. Go to **SQL Editor** → Run this migration:

```sql
-- Create photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  is_colorized BOOLEAN DEFAULT false,
  original_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_photos_user_id ON photos(user_id);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policies for both authenticated and anonymous access
CREATE POLICY "Anyone can view photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert own photos" ON photos FOR INSERT WITH CHECK (auth.uid() = user_id OR (auth.role() = 'anon' AND user_id IS NULL));
CREATE POLICY "Anonymous users can insert photos" ON photos FOR INSERT WITH CHECK (auth.role() = 'anon' AND user_id IS NULL);
CREATE POLICY "Users can delete own photos" ON photos FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anonymous can delete orphan photos" ON photos FOR DELETE USING (auth.role() = 'anon' AND user_id IS NULL);
CREATE POLICY "Users can update own photos" ON photos FOR UPDATE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON photos TO authenticated;
GRANT ALL ON photos TO anon;
```

4. Enable Email authentication:
   - Go to **Authentication** → **Providers**
   - Enable **Email** provider
   - (Optional) Disable email confirmation for testing

### 3. Set Up Replicate

1. Sign up at [replicate.com](https://replicate.com)
2. Get your API token from [Account Settings](https://replicate.com/account/api-tokens)
3. Add credit ($10 recommended - covers hundreds of colorizations)

### 4. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Supabase (get these from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Replicate (for AI colorization)
REPLICATE_API_TOKEN=r8_your-token-here

# Optional: Gemini (legacy fallback - not required)
GEMINI_API_KEY=your-gemini-key
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

### 6. Deploy to Vercel

```bash
# Push to GitHub
git push

# Connect to Vercel and deploy
# Don't forget to add environment variables in Vercel settings!
```

---

## 🏗️ Technical Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components
- **State Management**: React Context (Auth) + local state

### Backend
- **Database**: Supabase Postgres
- **Storage**: Supabase Storage (public bucket)
- **Authentication**: Supabase Auth (email/password)
- **API Routes**: Next.js API routes
- **Image Processing**: Sharp (resizing, format conversion)

### AI Colorization
- **Primary**: DeOldify via Replicate API
  - Model: `arielreplicate/deoldify_image`
  - Quality: Artistic mode, render_factor 35
  - Cost: ~$0.002-0.01 per image
- **Fallback**: Mock colorization (warm tint effect)

---

## 📁 Project Structure

```
persona-album/
├── app/
│   ├── page.tsx              # Main dashboard
│   ├── login/
│   │   └── page.tsx          # Login/signup page
│   ├── layout.tsx            # Root layout with AuthProvider
│   ├── globals.css           # Global styles
│   └── api/                  # API routes
│       ├── upload/           # Photo upload endpoint
│       ├── photos/           # List/get/delete photos
│       └── colorize/         # AI colorization endpoint
├── components/
│   ├── UploadZone.tsx        # Drag-and-drop upload
│   ├── PhotoGallery.tsx      # Photo grid display
│   ├── ColorizeZone.tsx      # Colorization drop zone
│   └── ResultPreview.tsx     # Side-by-side comparison
├── lib/
│   ├── supabase.ts           # Supabase client config
│   ├── storage.ts            # Photo storage helpers
│   ├── colorize.ts           # AI colorization logic
│   └── auth-context.tsx      # Auth state management
└── public/
    └── ...                   # Static assets
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/upload` | Upload photo(s) | No (optional) |
| GET | `/api/photos` | List all photos | No |
| GET | `/api/photos/:id` | Get photo details | No |
| DELETE | `/api/photos/:id` | Delete photo | No (RLS enforced) |
| POST | `/api/colorize` | Colorize photo | No (optional) |

---

## 📊 Data Models

### Photo
```typescript
interface PhotoMetadata {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  createdAt: string;
  isColorized: boolean;
  originalId?: string;  // Links colorized photo to original
  userId?: string;      // Owner (null for anonymous uploads)
}
```

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)** enabled on photos table
- **Permissive policies** allow both authenticated and anonymous access
- **Public storage bucket** for easy sharing
- **User isolation** ready (can be enabled by tightening RLS policies)
- **No sensitive data** stored in photos table

---

## 💰 Cost Breakdown

### Free Tier (Development)
- **Supabase**: Free tier includes 500MB storage, 50MB database
- **Vercel**: Free tier includes unlimited deployments
- **Next.js**: Free and open source

### Paid Services
- **Replicate API**: ~$0.002-0.01 per colorization
  - $10 = ~1,000-5,000 images
  - Pay-as-you-go, no monthly fees

**Total**: ~$10-20/month for moderate usage

---

## 🎯 User Flow

### Anonymous User
1. Visit dashboard → Upload photos
2. Drag photo to colorize zone
3. Wait ~30-60 seconds for AI processing
4. View/download colorized result
5. All photos visible to everyone

### Authenticated User
1. Sign up/login with email
2. Upload photos (associated with account)
3. Colorize photos
4. Photos tracked by user_id in database
5. Can delete own photos

---

## 🐛 Troubleshooting

### "Colorization failed"
- Check `REPLICATE_API_TOKEN` is set correctly
- Verify Replicate account has credit
- Check Vercel function logs for errors

### "Upload failed"
- Verify Supabase bucket `photos` exists and is public
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Ensure RLS policies are created

### "Can't see photos"
- Run the SQL migration to create `photos` table
- Check Supabase RLS policies are enabled
- Verify `GRANT ALL` permissions for anon/authenticated roles

---

## 🚧 Roadmap

- [x] Photo upload and storage
- [x] AI colorization with DeOldify
- [x] User authentication
- [x] Photo ownership tracking
- [ ] Batch colorization (multiple photos at once)
- [ ] Private galleries (enforce user isolation)
- [ ] Colorization history
- [ ] Quality/style presets (Artistic vs Stable)
- [ ] Social sharing

---

## 📝 License

MIT License - feel free to use this project for learning or your own applications!

---

## 🙏 Acknowledgments

- **DeOldify** - AI colorization model
- **Replicate** - Model hosting and API
- **Supabase** - Backend infrastructure
- **Vercel** - Deployment platform
- **Next.js** - React framework

---

Built with ❤️ by [eikocode](https://github.com/eikocode)
