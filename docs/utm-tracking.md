# UTM Tracking System

## Overview

The UTM tracking system captures two separate events from the same tagged link:
1. **Landing Event** - Tracked when a user first arrives at the site with UTM parameters (QR scan / landing page hit)
2. **Will Completion Event** - Tracked when a user successfully completes and saves their will

Both events carry the same UTM parameters (source, medium, campaign), allowing you to calculate conversion ratios.

## Database Schema

### Table: `utm_tracking_event`

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | Primary key |
| `created_at` | timestamp | When the event was tracked |
| `event_type` | text | Either 'landing' or 'will_completion' |
| `utm_source` | text | UTM source parameter |
| `utm_medium` | text | UTM medium parameter |
| `utm_campaign` | text | UTM campaign parameter |
| `will_id` | integer | Foreign key to free_will table (for completions) |
| `email` | text | User's email (for completions) |
| `session_id` | text | Browser session ID for correlating events |
| `payload` | jsonb | Additional tracking data |

### Indexes

- `utm_tracking_event_type_idx` on `event_type`
- `utm_tracking_event_source_idx` on `utm_source`
- `utm_tracking_event_session_idx` on `session_id`
- `utm_tracking_event_will_idx` on `will_id`

## How It Works

### 1. Landing Event Tracking

When a user arrives at the site with UTM parameters in the URL:
- `captureFirstTouchUtm()` in `src/lib/utm.ts` reads the UTM params from the URL
- Stores them in localStorage for persistence across pages
- Sends a "landing" event to `/api/utm-tracking`
- Associates the event with a session ID

### 2. Will Completion Tracking

When a user completes their will:
- `trackWillCompletion()` is called in `persistToAccount()` function
- Retrieves the stored UTM params from localStorage
- Sends a "will_completion" event to `/api/utm-tracking`
- Associates the event with the will ID and user email

## Example Queries

### View all tracking events
```sql
SELECT * FROM utm_tracking_event
ORDER BY created_at DESC;
```

### Calculate conversion ratio by UTM source
```sql
SELECT 
  utm_source,
  COUNT(*) FILTER (WHERE event_type = 'landing') as landings,
  COUNT(*) FILTER (WHERE event_type = 'will_completion') as completions,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'will_completion')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'landing'), 0) * 100,
    2
  ) as conversion_rate_pct
FROM utm_tracking_event
WHERE utm_source IS NOT NULL
GROUP BY utm_source
ORDER BY landings DESC;
```

### Conversion by campaign
```sql
SELECT 
  utm_campaign,
  utm_source,
  utm_medium,
  COUNT(*) FILTER (WHERE event_type = 'landing') as landings,
  COUNT(*) FILTER (WHERE event_type = 'will_completion') as completions,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'will_completion')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'landing'), 0) * 100,
    2
  ) as conversion_rate_pct
FROM utm_tracking_event
WHERE utm_campaign IS NOT NULL
GROUP BY utm_campaign, utm_source, utm_medium
ORDER BY landings DESC;
```

### View events for a specific session
```sql
SELECT 
  event_type,
  created_at,
  utm_source,
  utm_medium,
  utm_campaign,
  will_id,
  email
FROM utm_tracking_event
WHERE session_id = '<session-id>'
ORDER BY created_at ASC;
```

### Recent completions with UTM attribution
```sql
SELECT 
  ute.created_at,
  ute.email,
  ute.utm_source,
  ute.utm_medium,
  ute.utm_campaign,
  ute.will_id
FROM utm_tracking_event ute
WHERE ute.event_type = 'will_completion'
ORDER BY ute.created_at DESC
LIMIT 50;
```

## API Endpoint

### POST `/api/utm-tracking`

Receives tracking events from the client.

**Request Body:**
```json
{
  "eventType": "landing" | "will_completion",
  "utmSource": "qr_code",
  "utmMedium": "physical",
  "utmCampaign": "masjid_outreach",
  "sessionId": "uuid-string",
  "willId": 123,          // optional, for completions
  "email": "user@example.com"  // optional, for completions
}
```

**Response:**
```json
{
  "success": true,
  "tracked": true
}
```

## Migration

Run the migration to create the table:
```bash
# Apply the migration
npm run db:migrate
```

The migration file is located at `drizzle/0007_add_utm_tracking.sql`.

## Notes

- Events are tracked client-side via fetch requests
- Tracking failures are silent (won't block user experience)
- Session IDs are stored in localStorage and persist across page loads
- UTM parameters are captured on first page load and persist until localStorage is cleared
- Both landing and completion events use the same UTM tags from the initial page load
