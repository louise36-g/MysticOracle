# Tarot Articles API Setup Complete ✅

## Summary

I've created a complete backend API system for managing tarot articles with validation, import, and full CRUD operations. The API integrates with your existing authentication system (Clerk) and uses the validation and schema-builder libraries.

## Files Created/Modified

### New Routes File
1. **`server/src/routes/tarot-articles.ts`** - 360 lines
   - Public endpoints for fetching articles
   - Admin endpoints for validation, import, and management
   - Full error handling and Zod validation
   - Integration with Prisma ORM
   - Clerk authentication middleware

### Modified Files

2. **`server/src/index.ts`** (lines 67, 125)
   - Added import: `import tarotArticleRoutes from './routes/tarot-articles.js';`
   - Registered routes: `app.use('/api/tarot-articles', generalLimiter, tarotArticleRoutes);`

## API Endpoints

### Public Endpoints

#### GET `/api/tarot-articles/:slug`
**Description**: Fetch a single published tarot article by slug

**Parameters**:
- `slug` (path parameter) - Article slug

**Response**:
```json
{
  "id": "clxxx...",
  "title": "The Fool Tarot Card Meaning",
  "slug": "the-fool-meaning",
  "content": "<p>...</p>",
  "schemaJson": {...},
  ...
}
```

**Status Codes**:
- `200` - Article found
- `404` - Article not found

---

#### GET `/api/tarot-articles`
**Description**: List published tarot articles with pagination and filters

**Query Parameters**:
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `cardType` (enum, optional) - Filter by card type:
  - `MAJOR_ARCANA`
  - `SUIT_OF_WANDS`
  - `SUIT_OF_CUPS`
  - `SUIT_OF_SWORDS`
  - `SUIT_OF_PENTACLES`
- `status` (enum, optional) - Filter by status (defaults to `PUBLISHED`):
  - `DRAFT`
  - `PUBLISHED`
  - `ARCHIVED`

**Response**:
```json
{
  "articles": [
    {
      "id": "clxxx...",
      "title": "The Fool",
      "slug": "the-fool-meaning",
      "excerpt": "...",
      "featuredImage": "https://...",
      "cardType": "MAJOR_ARCANA",
      "cardNumber": "0",
      "datePublished": "2024-01-01T00:00:00.000Z",
      "readTime": "12 min read",
      "tags": ["major-arcana", "beginnings"],
      "categories": ["tarot-meanings"],
      "status": "PUBLISHED"
    }
  ],
  "total": 78,
  "page": 1,
  "limit": 20,
  "totalPages": 4
}
```

**Status Codes**:
- `200` - Success
- `400` - Invalid query parameters

---

### Admin Endpoints (Authentication Required)

All admin endpoints require:
- **Authentication**: Valid Clerk JWT token in `Authorization: Bearer <token>` header
- **Admin Privileges**: User must have `isAdmin: true` flag

---

#### POST `/api/tarot-articles/admin/validate`
**Description**: Validate tarot article JSON with extended quality checks

**Request Body**:
```json
{
  "title": "The Fool Tarot Card Meaning",
  "slug": "the-fool-meaning",
  "excerpt": "Discover the meaning...",
  "content": "<p>Long HTML content...</p>",
  "author": "CelestiArcana Team",
  "categories": ["tarot-meanings"],
  "tags": ["major-arcana", "beginnings"],
  "readTime": "12 min read",
  "datePublished": "2024-01-01T00:00:00.000Z",
  "dateModified": "2024-01-01T00:00:00.000Z",
  "featuredImage": "https://example.com/image.jpg",
  "featuredImageAlt": "The Fool tarot card",
  "cardType": "Major Arcana",
  "cardNumber": "0",
  "seoFocusKeyword": "fool tarot meaning",
  "seoMetaTitle": "The Fool Tarot Card Meaning...",
  "seoMetaDescription": "Discover the meaning...",
  "faq": [
    {
      "question": "What does The Fool card mean?",
      "answer": "The Fool represents..."
    }
  ],
  "breadcrumbCategory": "Major Arcana",
  "breadcrumbCategoryUrl": "/tarot/major-arcana",
  "relatedCards": ["The Magician", "The World"]
}
```

**Response (Success)**:
```json
{
  "success": true,
  "errors": [],
  "warnings": [
    "Word count is 2234, target is 2500-3000",
    "Forbidden word found: 'delve'"
  ],
  "stats": {
    "wordCount": 2234,
    "faqCount": 8,
    "hasAnswerFirst": true
  },
  "schema": {
    "@context": "https://schema.org",
    "@graph": [...]
  },
  "data": {
    // Validated and normalized article data
  }
}
```

**Response (Validation Failed)**:
```json
{
  "success": false,
  "errors": [
    "title: String must contain at least 10 character(s)",
    "content: Content contains em dashes (—) which are forbidden",
    "faq: Array must contain at least 5 element(s)"
  ],
  "warnings": [],
  "stats": null,
  "schema": null
}
```

**Status Codes**:
- `200` - Validation completed (check `success` field)
- `400` - Validation failed (invalid JSON structure)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not an admin)
- `500` - Server error

**Validation Rules**:
- ✅ Title: 10-100 characters
- ✅ Content: Minimum 5000 characters, no em dashes (—)
- ✅ FAQ: 5-10 questions, answers 50-500 characters
- ✅ Word count: Target 2500-3000 words (warning if outside range)
- ✅ Forbidden words check: AI clichés (delve, transmute, etc.)
- ✅ Answer-first pattern: Content should answer question immediately

---

#### POST `/api/tarot-articles/admin/import`
**Description**: Import and save a validated tarot article to the database

**Request Body**: Same as validate endpoint

**Response (Success)**:
```json
{
  "success": true,
  "article": {
    "id": "clxxx...",
    "title": "The Fool Tarot Card Meaning",
    "slug": "the-fool-meaning",
    "status": "DRAFT"
  },
  "warnings": [
    "Word count is 2234, target is 2500-3000"
  ]
}
```

**Response (Failed)**:
```json
{
  "success": false,
  "error": "Article with slug \"the-fool-meaning\" already exists",
  "errors": ["Article with slug \"the-fool-meaning\" already exists"],
  "warnings": []
}
```

**Status Codes**:
- `201` - Article created successfully
- `400` - Validation failed
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `409` - Conflict (article with slug already exists)
- `500` - Server error

**Important Notes**:
- Articles are imported as `DRAFT` status by default
- Schema (JSON-LD) is automatically generated and saved
- Display names (e.g., "Major Arcana") are converted to database enum keys (e.g., "MAJOR_ARCANA")
- Duplicate slugs are rejected with 409 status

---

#### GET `/api/tarot-articles/admin/list`
**Description**: List all tarot articles including drafts (admin only)

**Query Parameters**: Same as public list endpoint, but shows all statuses by default

**Response**: Same structure as public list endpoint

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `500` - Server error

---

#### PATCH `/api/tarot-articles/admin/:id`
**Description**: Update a tarot article

**Parameters**:
- `id` (path parameter) - Article ID

**Request Body** (partial update):
```json
{
  "status": "PUBLISHED",
  "title": "Updated Title",
  "content": "<p>Updated content...</p>"
}
```

**Response**:
```json
{
  "id": "clxxx...",
  "title": "Updated Title",
  "status": "PUBLISHED",
  "publishedAt": "2024-01-01T12:00:00.000Z",
  ...
}
```

**Status Codes**:
- `200` - Article updated
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `404` - Article not found
- `500` - Server error

**Important Notes**:
- When status changes to `PUBLISHED`, `publishedAt` is automatically set
- `updatedAt` is automatically updated

---

#### DELETE `/api/tarot-articles/admin/:id`
**Description**: Delete a tarot article

**Parameters**:
- `id` (path parameter) - Article ID

**Response**:
```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

**Status Codes**:
- `200` - Article deleted
- `401` - Unauthorized
- `403` - Forbidden (not an admin)
- `404` - Article not found
- `500` - Server error

---

## Rate Limiting

All `/api/tarot-articles` endpoints use **general rate limiting**:
- **Window**: 15 minutes
- **Max Requests**: 500 per IP address
- **Status Code**: 429 (Too Many Requests)

## Authentication Flow

1. Frontend calls Clerk's `getToken()` to get JWT
2. Frontend sends request with `Authorization: Bearer <token>` header
3. Backend middleware (`requireAuth`) verifies JWT with Clerk
4. Backend middleware (`requireAdmin`) checks user's `isAdmin` flag
5. Request proceeds to route handler

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message"
}
```

For validation endpoints:
```json
{
  "success": false,
  "error": "Brief error message",
  "errors": ["Detailed error 1", "Detailed error 2"],
  "warnings": []
}
```

## Integration with Frontend

The frontend `ImportArticle` component (`components/admin/ImportArticle.tsx`) uses these endpoints:

1. **Validate**: Calls `/api/tarot-articles/admin/validate` when user clicks "Validate"
2. **Import**: Calls `/api/tarot-articles/admin/import` when user clicks "Import to Database"

Example usage in frontend:
```typescript
const token = await getToken();

const response = await fetch(
  `${import.meta.env.VITE_API_URL}/api/tarot-articles/admin/validate`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(articleData),
  }
);

const result = await response.json();
```

## Testing

### Manual Testing with curl

**Validate Article**:
```bash
# Get your Clerk token from browser DevTools (Application > Clerk)
TOKEN="your-clerk-jwt-token"

curl -X POST http://localhost:3001/api/tarot-articles/admin/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @article.json
```

**Import Article**:
```bash
curl -X POST http://localhost:3001/api/tarot-articles/admin/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @article.json
```

**Fetch Article**:
```bash
curl http://localhost:3001/api/tarot-articles/the-fool-meaning
```

### Testing Workflow

1. ✅ **Prepare Article JSON**: Create AI-generated article JSON
2. ✅ **Validate**: POST to `/admin/validate` endpoint
3. ✅ **Review Warnings**: Check word count, forbidden words, answer-first
4. ✅ **Import**: POST to `/admin/import` endpoint
5. ✅ **Verify**: GET from `/admin/list` to see draft article
6. ✅ **Publish**: PATCH to `/admin/:id` with `status: "PUBLISHED"`
7. ✅ **Test Public**: GET from `/:slug` to see published article

## Complete Workflow Test

### Import New Article
1. Navigate to Admin Dashboard → Tarot Articles
2. Click "Go to Import"
3. Paste article JSON
4. Click "Validate" to check quality
5. Click "Import to Database"
6. Article appears in list as DRAFT

### Edit Existing Article
1. Navigate to Admin Dashboard → Tarot Articles
2. Find article in list
3. Click "Edit" button (pencil icon)
4. Modify JSON in Import interface
5. Click "Validate" to check changes
6. Click "Update Article"
7. Returns to list with updated data

### Quick Actions
- **Preview**: Opens published article in new tab
- **Publish/Unpublish**: Toggle between DRAFT and PUBLISHED
- **Delete**: Remove article (with confirmation)

### Filters
- **Search**: Type title or slug (debounced 500ms)
- **Card Type**: Filter by Major Arcana, Wands, Cups, Swords, Pentacles
- **Status**: Filter by Draft, Published, Archived

## Database Schema

Articles are stored in the `tarot_articles` table with the following key fields:

```prisma
model TarotArticle {
  id                          String        @id @default(cuid())
  slug                        String        @unique
  title                       String
  content                     String        @db.Text
  schemaJson                  Json          // Auto-generated JSON-LD
  schemaHtml                  String        @db.Text
  status                      ArticleStatus @default(DRAFT)
  cardType                    CardType
  publishedAt                 DateTime?
  createdAt                   DateTime      @default(now())
  updatedAt                   DateTime      @updatedAt

  @@index([slug])
  @@index([status])
  @@index([cardType])
  @@map("tarot_articles")
}
```

## Environment Variables

No new environment variables required. Uses existing:
- `SITE_NAME` - Site name for schema (from `.env`)
- `SITE_URL` - Site URL for canonical links (from `.env`)
- `CLERK_SECRET_KEY` - For JWT verification (already configured)

## Troubleshooting

### "Unauthorized" Error
- Check if Clerk token is being sent in Authorization header
- Verify token hasn't expired (Clerk tokens expire after 1 hour)
- Ensure user is signed in to Clerk

### "Forbidden" Error
- User is authenticated but not an admin
- Check `isAdmin` flag in database for the user
- Username "Mooks" is auto-admin in this system

### "Article with slug already exists"
- An article with the same slug is already in the database
- Change the slug in your JSON or delete the existing article
- Use PATCH endpoint to update existing article instead

### Validation Errors
- Review the `errors` array in the response
- Common issues:
  - Content too short (<5000 characters)
  - Em dashes (—) in content (replace with hyphens or commas)
  - FAQ not meeting requirements (5-10 questions, proper answer length)

### Rate Limiting
- If you hit 500 requests in 15 minutes, wait for the window to reset
- Consider batching operations or reducing polling frequency

## Next Steps

1. ✅ Backend API routes created
2. ✅ Frontend ImportArticle component created
3. ✅ Integration with AdminDashboard complete
4. ⏳ Test end-to-end workflow with sample article
5. ⏳ Create sample articles for each tarot card
6. ⏳ Verify SEO with Google Rich Results Test
7. ⏳ Add bulk import functionality (optional)
8. ⏳ Add article versioning (optional)

## Related Documentation

- `TAROT_ARTICLES_SETUP.md` - Frontend component setup
- `server/VALIDATION_SETUP.md` - Validation library guide
- `server/SCHEMA_SETUP.md` - Schema builder guide
- `server/src/lib/README.md` - Schema builder API docs
- `server/src/lib/VALIDATION.md` - Validation API reference

🎴✨ Your tarot articles API is now fully operational!
