# MysticOracle - API Specification

## Base URL

- Development: `http://localhost:3001/api`
- Production: `https://api.mysticoracle.com/api`

## Authentication

All authenticated endpoints require Clerk JWT in Authorization header:
```
Authorization: Bearer <clerk_jwt_token>
```

## Endpoints

### Health

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### Users

#### GET /users/me
Get current user profile.

**Auth:** Required

**Response:**
```json
{
  "id": "user_xxx",
  "email": "user@example.com",
  "username": "username",
  "credits": 10,
  "isAdmin": false,
  "referralCode": "ABC123",
  "streakCount": 5
}
```

#### PATCH /users/me
Update user preferences.

**Auth:** Required

**Body:**
```json
{
  "username": "new_username",
  "language": "fr"
}
```

#### POST /users/me/daily-bonus
Claim daily login bonus.

**Auth:** Required

**Response:**
```json
{
  "credits": 2,
  "streakBonus": 5,
  "newStreak": 7,
  "totalCredits": 17
}
```

#### GET /users/me/readings
Get user's reading history.

**Auth:** Required

**Response:**
```json
{
  "readings": [
    {
      "id": "reading_xxx",
      "spreadType": "THREE_CARD",
      "question": "What should I focus on?",
      "cards": [...],
      "interpretation": "AI interpretation...",
      "followUpQuestions": [...],
      "userReflection": "My thoughts...",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET /users/me/transactions
Get user's transaction history.

**Auth:** Required

**Response:**
```json
{
  "transactions": [
    {
      "id": "txn_xxx",
      "type": "READING",
      "amount": -3,
      "description": "Three Card reading",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### Readings

#### POST /readings
Create a new tarot reading.

**Auth:** Required

**Body:**
```json
{
  "spreadType": "THREE_CARD",
  "question": "What should I focus on?",
  "interpretationStyle": "CLASSIC",
  "cards": [
    { "cardId": "the_fool", "position": 0, "isReversed": false },
    { "cardId": "the_magician", "position": 1, "isReversed": true },
    { "cardId": "the_high_priestess", "position": 2, "isReversed": false }
  ],
  "interpretation": "AI-generated interpretation..."
}
```

**Response:**
```json
{
  "id": "reading_xxx",
  "creditsRemaining": 8
}
```

#### PATCH /readings/:id
Update reading (add reflection).

**Auth:** Required

**Body:**
```json
{
  "userReflection": "My personal thoughts on this reading..."
}
```

#### POST /readings/:id/follow-up
Ask a follow-up question (2 questions per 1 credit).

**Auth:** Required

**Body:**
```json
{
  "question": "Can you elaborate on the second card?",
  "answer": "AI-generated answer..."
}
```

**Response:**
```json
{
  "id": "followup_xxx",
  "question": "Can you elaborate...",
  "answer": "AI answer...",
  "creditCost": 1,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### Payments

#### POST /payments/stripe/checkout
Create Stripe checkout session.

**Auth:** Required

**Body:**
```json
{
  "packageId": "popular_25"
}
```

**Response:**
```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

#### POST /payments/paypal/order
Create PayPal order.

**Auth:** Required

**Body:**
```json
{
  "packageId": "popular_25"
}
```

#### POST /payments/paypal/capture
Capture PayPal payment.

**Auth:** Required

**Body:**
```json
{
  "orderId": "xxx"
}
```

---

### Blog (Public)

#### GET /blog/posts
List published posts.

**Query:**
- `category` - Filter by category slug
- `tag` - Filter by tag slug
- `limit` (default: 10)
- `offset` (default: 0)

#### GET /blog/posts/:slug
Get single post by slug.

#### GET /blog/categories
List all categories.

#### GET /blog/tags
List all tags.

---

### Blog (Admin)

#### GET /blog/admin/posts
List all posts including drafts.

**Auth:** Admin required

#### POST /blog/admin/posts
Create new post.

**Auth:** Admin required

#### PATCH /blog/admin/posts/:id
Update post.

**Auth:** Admin required

#### DELETE /blog/admin/posts/:id
Soft delete post.

**Auth:** Admin required

#### POST /blog/admin/posts/:id/restore
Restore deleted post.

**Auth:** Admin required

#### POST /blog/admin/import
Bulk import posts from JSON.

**Auth:** Admin required

---

### Horoscopes

#### GET /horoscopes/:sign
Get daily horoscope for zodiac sign.

**Params:**
- `sign`: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces

**Query:**
- `language` (default: en)

#### POST /horoscopes/:sign/followup
Ask follow-up question about horoscope.

**Auth:** Required

**Body:**
```json
{
  "question": "What does this mean for my career?"
}
```

---

### Admin

#### GET /admin/stats
Dashboard statistics.

**Auth:** Admin required

#### GET /admin/users
List all users with pagination.

**Auth:** Admin required

**Query:**
- `page` (default: 1)
- `limit` (default: 20)
- `search` - Search by email/username
- `status` - Filter by account status

#### PATCH /admin/users/:id/status
Update user account status.

**Auth:** Admin required

**Body:**
```json
{
  "status": "SUSPENDED"
}
```

---

### Webhooks

#### POST /webhooks/clerk
Clerk user sync webhook.

**Headers:**
- `svix-id`
- `svix-timestamp`
- `svix-signature`

#### POST /webhooks/stripe
Stripe payment webhook.

**Headers:**
- `stripe-signature`

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid auth |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| INSUFFICIENT_CREDITS | 400 | Not enough credits |
| VALIDATION_ERROR | 400 | Invalid request body |
| INTERNAL_ERROR | 500 | Server error |
