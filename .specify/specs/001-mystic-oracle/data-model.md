# CelestiArcana - Data Model

## Overview

- **Database**: PostgreSQL on Render (Frankfurt EU)
- **ORM**: Prisma
- **Connection**: Via DATABASE_URL environment variable

## Core Models

### User

Primary user entity, synced from Clerk.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Clerk user ID (primary key) |
| email | String | User email |
| username | String? | Display name |
| credits | Int | Current credit balance (default: 3) |
| isAdmin | Boolean | Admin access flag |
| accountStatus | Enum | ACTIVE, FLAGGED, SUSPENDED |
| referralCode | String | Unique referral code |
| referredBy | String? | Referrer's code |
| dailyBonusDate | DateTime? | Last daily bonus claim |
| streakCount | Int | Consecutive daily logins |
| createdAt | DateTime | Account creation |
| updatedAt | DateTime | Last update |

### Reading

Tarot reading records.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID |
| userId | String | FK to User |
| spreadType | Enum | SINGLE, THREE_CARD, etc. |
| question | String? | User's question |
| cards | Json | Array of drawn cards |
| interpretation | String | AI-generated interpretation |
| interpretationStyle | Enum | CLASSIC, SPIRITUAL, etc. |
| followUpQuestions | Json | Array of follow-up Q&As |
| userReflection | String? | User's personal reflection |
| themes | Json? | Extracted themes |
| createdAt | DateTime | Reading timestamp |

### Transaction

Credit economy audit log.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID |
| userId | String | FK to User |
| type | Enum | PURCHASE, READING, DAILY_BONUS, etc. |
| amount | Int | Credit change (positive or negative) |
| description | String | Human-readable description |
| paymentProvider | String? | stripe, paypal |
| paymentId | String? | External payment ID |
| createdAt | DateTime | Transaction timestamp |

### BlogPost

Blog content.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID |
| slug | String | URL slug (unique) |
| title | String | Post title |
| titleFr | String? | French title |
| content | String | HTML content |
| contentFr | String? | French content |
| excerpt | String | Short description |
| excerptFr | String? | French excerpt |
| author | String | Author name |
| coverImage | String? | Cover image URL |
| readTime | String? | Estimated read time |
| status | Enum | DRAFT, PUBLISHED, ARCHIVED |
| publishedAt | DateTime? | Publish timestamp |
| deletedAt | DateTime? | Soft delete timestamp |
| originalSlug | String? | Pre-deletion slug |
| seoMeta | Json? | SEO fields |
| categories | Relation | Many-to-many |
| tags | Relation | Many-to-many |

### BlogCategory / BlogTag

Taxonomies for blog posts.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID |
| name | String | Display name |
| slug | String | URL slug |
| description | String? | Category/tag description |
| color | String? | Display color |
| icon | String? | Icon identifier |

### HoroscopeCache

Daily horoscope cache.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID |
| sign | String | Zodiac sign |
| date | DateTime | Horoscope date |
| language | String | Language code (en/fr) |
| content | String | Generated content |
| createdAt | DateTime | Generation timestamp |

### Achievement

User achievement/badge records.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID |
| userId | String | FK to User |
| type | String | Achievement type identifier |
| unlockedAt | DateTime | When achieved |

## Enums

```prisma
enum AccountStatus {
  ACTIVE
  FLAGGED
  SUSPENDED
}

enum SpreadType {
  SINGLE
  THREE_CARD
  LOVE
  CAREER
  HORSESHOE
  CELTIC_CROSS
}

enum InterpretationStyle {
  CLASSIC
  SPIRITUAL
  PSYCHO_EMOTIONAL
  NUMEROLOGY
  ELEMENTAL
}

enum TransactionType {
  PURCHASE
  READING
  QUESTION
  DAILY_BONUS
  ACHIEVEMENT
  REFERRAL_BONUS
  REFUND
}

enum BlogPostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

## Indexes

```prisma
@@index([userId]) // On Reading, Transaction
@@index([slug])   // On BlogPost
@@index([status]) // On BlogPost
@@index([sign, date, language]) // On HoroscopeCache
```

## Future Additions (Mobile Integration)

See plan.md Phase 3 for SagaProgress and CardMastery models that will be added when mobile integration begins.
