# CelestiArcana - Feature Specification

## Product Overview

CelestiArcana is a web-based tarot reading platform with AI-powered interpretations, daily horoscopes, and a content blog. It serves as both a standalone product and a funnel to the AI Tarot Saga mobile app.

## User Personas

### Free User
- Gets 3 credits on signup
- Earns 2 credits daily (+5 streak bonus)
- Can do ~1-2 readings per day for free
- Target: Casual tarot curious

### Paying User
- Purchases credit packs
- Does multiple readings
- Uses premium features
- Target: Tarot enthusiast

### Admin
- Manages content (blog, categories)
- Monitors users and transactions
- Configures system settings

## Feature Areas

### 1. Tarot Readings

#### Spread Types
| Spread | Cards | Credits | Use Case |
|--------|-------|---------|----------|
| Single Card | 1 | 1 | Quick guidance |
| Three Card | 3 | 3 | Past/Present/Future |
| Love | 5 | 5 | Relationships |
| Career | 5 | 5 | Work/Purpose |
| Horseshoe | 7 | 7 | Complex situations |
| Celtic Cross | 10 | 10 | Deep analysis |

#### Interpretation Styles
- Classic (traditional meanings)
- Spiritual (mystical/intuitive)
- Psycho-Emotional (psychological)
- Numerology (number significance)
- Elemental (earth/air/fire/water)

#### Reading Flow
1. Select spread type
2. Enter question (optional)
3. Select interpretation style
4. Shuffle and draw cards
5. View AI interpretation
6. Ask follow-up questions (2 questions per 1 credit)
7. Add personal reflection
8. Save to history

### 2. Daily Horoscope

- Generated daily per zodiac sign
- AI-powered via OpenRouter
- Cached in database
- Free to view (engagement feature)
- Follow-up questions available

### 3. Blog CMS

#### Content Types
- Articles (tarot education, spirituality)
- Guides (how to read cards)
- News (product updates)

#### Features
- Visual and Markdown editors
- Categories and tags
- SEO meta fields
- Multi-language (EN/FR)
- Soft delete with trash
- JSON bulk import
- Media management

### 4. Credit Economy

#### Earning Credits
| Source | Amount | Frequency |
|--------|--------|-----------|
| Signup bonus | 3 | Once |
| Daily login | 2 | Daily |
| 7-day streak | +5 | Weekly |
| Referral | 5 | Per referral |
| Achievements | Varies | On unlock |

#### Spending Credits
| Action | Cost |
|--------|------|
| Single card reading | 1 |
| Three card reading | 3 |
| Love/Career spread | 5 |
| Horseshoe spread | 7 |
| Celtic Cross | 10 |
| Follow-up questions | 1 per 2 questions |

#### Purchasing Credits
| Pack | Credits | Price | Per Credit |
|------|---------|-------|------------|
| Starter | 10 | €4.99 | €0.50 |
| Popular | 25 | €9.99 | €0.40 |
| Best Value | 60 | €19.99 | €0.33 |

### 5. User Profile

- Reading history with full interpretations
- Follow-up Q&A history
- User reflections
- Credit balance and transaction history
- Achievement badges
- Referral code and stats
- Preferences (language, style)

### 6. Admin Dashboard

#### Tabs
1. **Overview**: Key metrics, recent activity
2. **Users**: User management, status control
3. **Transactions**: Payment history
4. **Analytics**: Charts and trends
5. **Blog**: Content management (posts, categories, tags, media, trash)
6. **Packages**: Credit pack configuration
7. **Email**: Template management
8. **Translations**: i18n strings
9. **Health**: Service status
10. **Settings**: System configuration

## Future Features (Roadmap)

### Mobile Funnel
- Tarot Saga teaser (Fool's Journey preview)
- "Continue in App" CTA
- Progress sync between web and mobile

### New Divination Tools
- Rune readings
- I Ching
- Birth chart analysis
- Numerology calculator

### Enhanced Features
- Reading sharing (social)
- Audio interpretations
- Custom spread builder
- Tarot journal
