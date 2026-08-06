# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## �� 🚀 Development Commands

Commonly used commands for development:

```bash
# Install dependencies (first time or after package.json changes)
npm install

# Start development server at http://localhost:3000
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint for code quality
npm run lint

# Format code (if Prettier is configured)
# npx prettier --write .
```

### Environment Setup

1. Copy `.env.example` to `.env.local` and add your API keys:
   ```bash
   cp .env.example .env.local
   ```
2. Get a free API key from [Watchmode](https://api.watchmode.com/) (no credit card required)
3. Optionally get a TMDB API key for enhanced search from [TMDB](https://www.themoviedb.org/settings/api)
4. Add keys to `.env.local`:
   ```
   WATCHMODE_API_KEY=your_key_here
   TMDB_API_KEY=your_tmdb_key_here  # optional but recommended
   ```

## �� 🏗��️ Architecture & Code Structure

### High-Level Overview

This is a Next.js 16.2.12 application using the **App Router** architecture. The app helps users find where movies and TV shows are available for streaming in the Netherlands (default region).

### Key Directories & Files

```
/app
  /api/search/route.ts   # Backend API endpoint for search logic
  layout.tsx             # Root layout with metadata, CSS imports, and analytics
  page.tsx               # Main search interface (Home component)
/public                  # Static assets (icons, images)
```

### Data Flow

1. **Frontend** (`page.tsx`):
   - User types search query in input field
   - Live suggestions appear after 3+ characters (debounced API call)
   - Form submission triggers detailed search
   - Results display poster, title, year, and streaming availability badges

2. **Backend** (`app/api/search/route.ts`):
   - Accepts `q` (query) and `region` parameters
   - Uses TMDB API for fuzzy search with popularity sorting (if TMDB key available)
   - Falls back to Watchmode direct search if TMDB not configured
   - Fetches streaming sources for each result from Watchmode API
   - Returns structured JSON with title info and streaming sources

3. **Streaming Sources Matching**:
   - Compares API results against predefined `MAJOR_PLATFORMS` array
   - Shows "available" badge if found, "not beschikbaar" otherwise
   - Links directly to streaming service when available

### Important Implementation Details

- **Type Safety**: Heavy use of TypeScript interfaces (`StreamingResult`, `Source`)
- **Optimistic UI**: Loading states, error handling, and empty states throughout
- **Debounced Search**: 300ms delay for live suggestions to reduce API calls
- **Environment Variables**: API keys loaded via `process.env` in route handlers
- **Client Components**: Most components use `"use client"` for interactivity
- **Metadata**: SEO tags and Google verification in `layout.tsx`
- **Analytics**: Vercel Analytics integrated in root layout

### Styling Approach

- **TailwindCSS v4** utility-first styling
- Custom CSS in `app/globals.css` (imported in layout)
- Dark theme with navy/black background (`bg-[#10131a]`, `bg-[#181c27]`)
- Accent colors: Neon cyan (`#00f2fe`) for interactive elements
- Responsive design with mobile-first breakpoints
- Subtle animations and hover states

## �� 📝 File Conventions

- **API Routes**: Located in `app/api/[segment]/route.ts`, use `export async function GET/POST/etc()`
- **Components**: Client components marked with `"use client"` directive
- **Types**: Often defined alongside usage (e.g., in API route file)
- **Styling**: Tailwind utility classes directly in JSX
- **Environment**: `.env.local` for secrets, `.env.example` for template

## �� 🔧 Extending the Application

### Adding Features

1. **New Streaming Platforms**:
   - Add to `MAJOR_PLATFORMS` array in `page.tsx`
   - Ensure Watchmode API returns matching `sources.name` values

2. **Additional Search Fields**:
   - Modify `app/api/search/route.ts` search logic
   - Could add filters by year, type, etc.

3. **Caching** (as suggested in README):
   - Implement Vercel KV or Redis for API responses
   - Cache TMDB and Watchmode calls to reduce rates

4. **Improved Suggestions**:
   - Use TMDb search API for autocomplete (mentioned in README)
   - Add movie/show type filtering to suggestions

### Common Maintenance Tasks

- **Updating Dependencies**: `npm update` followed by testing
- **Checking API Limits**: Monitor Watchmode/TMDB usage in respective dashboards
- **TypeScript Issues**: Check `npm run build` for type errors before deploying
- **Production Deployments**: Push to GitHub and connect to Vercel (auto-detects Next.js)

## �� � Testing

Currently no test files are present in the repository. To add tests:

1. Consider adding Jest or Vitest for unit tests
2. Add E2E tests with Playwright or Cypress
3. Test API routes with supertest or similar
4. Test components with React Testing Library

<file_guidance>
See README.md for deployment instructions and feature extension ideas.
</file_guidance>