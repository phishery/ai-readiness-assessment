# AI Readiness & Optimization Report — n8n Workflow Blueprint

## Project Overview

A lead-generation tool where local service businesses paste their Google Business Profile URL, answer 6 questions, and receive a professional AI Readiness & Optimization Report via email within 2 minutes. The system scrapes their GBP data, benchmarks against local competitors, audits their website, and generates a scored PDF report with a 90-day action plan.

**Primary purpose:** Top-of-funnel acquisition for AgentLocal.ai
**Secondary purpose:** Standalone product (free or $29/report)
**Tertiary purpose:** White-label to marketing agencies ($99/month unlimited)

---

## System Architecture

```
┌─────────────────────┐
│   Landing Page       │  ← Vercel (agentlocal.ai/report or standalone domain)
│   (Next.js or HTML)  │
└────────┬────────────┘
         │ POST form data
         ▼
┌─────────────────────┐
│   n8n Webhook        │  ← Self-hosted n8n on Render
│   /webhook/report    │
└────────┬────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│              n8n Workflow                     │
│                                              │
│  1. Validate input + store lead              │
│  2. Scrape GBP data (SerpAPI)                │
│  3. Scrape competitors (SerpAPI)             │
│  4. Audit website (HTTP Request + Code)      │
│  5. Generate report (Claude Sonnet)          │
│  6. Build HTML report (Code Node)            │
│  7. Convert to PDF (Puppeteer)               │
│  8. Email report (Resend API)                │
│  9. Store report data (Supabase)             │
│  10. Trigger follow-up sequence              │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────┐     ┌──────────────────┐
│   Supabase           │     │  Resend Email     │
│   (leads + reports)  │     │  (delivery)       │
└─────────────────────┘     └──────────────────┘
```

---

## Tech Stack

| Component | Service | Why |
|-----------|---------|-----|
| Landing page | Vercel (Next.js or static HTML) | Already in your stack, fast deploys |
| Workflow engine | n8n (self-hosted, Render) | Already in your stack |
| GBP + competitor data | SerpAPI (Google Maps endpoint) | Reliable, structured JSON, $50/month covers ~5,000 searches |
| Website audit | n8n HTTP Request + Code nodes | No external service needed |
| AI report generation | Claude Sonnet via Anthropic API | Best quality for this type of analysis |
| PDF generation | Puppeteer (via n8n Execute Command) | Free, high-quality HTML→PDF |
| Email delivery | Resend (already configured for AgentLocal) | Transactional email, your domain |
| Database | Supabase | Already in your stack, free tier sufficient |
| File storage | Supabase Storage or Cloudflare R2 | Store generated PDFs |

---

## Database Schema (Supabase)

### Table: `report_leads`

```sql
CREATE TABLE report_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Submission data
  email TEXT NOT NULL,
  business_name TEXT NOT NULL,
  gbp_url TEXT NOT NULL,
  industry TEXT NOT NULL,
  monthly_budget TEXT,
  
  -- Survey responses
  responds_to_reviews BOOLEAN,
  posts_weekly BOOLEAN,
  has_service_pages BOOLEAN,
  runs_paid_ads BOOLEAN,
  customer_sources TEXT[], -- multi-select array
  growth_challenge TEXT,
  
  -- Scraped data (stored for re-analysis)
  gbp_data JSONB,
  competitor_data JSONB,
  website_audit_data JSONB,
  
  -- Report output
  report_json JSONB, -- full structured report
  report_pdf_url TEXT, -- link to stored PDF
  overall_score INTEGER, -- 0-100
  
  -- Funnel tracking
  report_sent_at TIMESTAMPTZ,
  report_opened BOOLEAN DEFAULT FALSE,
  followup_stage INTEGER DEFAULT 0, -- 0=none, 1=day2, 2=day5, 3=day10
  converted_to_agentlocal BOOLEAN DEFAULT FALSE,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_leads_email ON report_leads(email);
CREATE INDEX idx_report_leads_industry ON report_leads(industry);
CREATE INDEX idx_report_leads_score ON report_leads(overall_score);
```

### Table: `report_analytics`

```sql
CREATE TABLE report_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES report_leads(id),
  
  -- Aggregate insights (populated by weekly analysis workflow)
  most_common_issues TEXT[],
  avg_score_by_industry JSONB,
  conversion_correlation JSONB, -- which report sections correlate with signups
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Landing Page Specification

**URL:** `https://agentlocal.ai/report` (or standalone domain like `aireport.tools`)

**Design direction:** Clean, professional, trust-building. Not flashy — these are local business owners, not designers. Think Typeform meets a consulting firm.

**Page structure:**

### Section 1: Hero
- Headline: "Is Your Business Ready for AI Search?"
- Subhead: "Get a free AI Readiness & Optimization Report in under 2 minutes. See exactly how customers — and AI agents — find (or miss) your business."
- Visual: Animated score gauge going from 0 to a sample score
- Single CTA button: "Get Your Free Report →" (scrolls to form)

### Section 2: What You'll Get (3 cards)
- Card 1: "GBP Health Score" — How complete and competitive your Google profile is
- Card 2: "AI Readiness Score" — Whether AI assistants can find and recommend you
- Card 3: "90-Day Action Plan" — Prioritized fixes ranked by impact

### Section 3: The Form

**Form fields (single page, no multi-step needed):**

```
1. Google Business Profile URL *
   [text input]
   Helper text: "Search your business on Google Maps, click 'Share', copy the link"

2. Business Name *
   [text input]

3. Your Email *
   [email input]

4. Industry *
   [dropdown]
   Options: Plumbing | HVAC | Electrical | Roofing | General Contractor | 
            Landscaping | Pest Control | Cleaning | Dentist | 
            Auto Repair | Other (specify)

5. Monthly Marketing Budget
   [dropdown]
   Options: Under $500 | $500-$2,000 | $2,000-$5,000 | $5,000+ | Not sure

6. Quick Assessment (checkboxes — all visible, check what applies):
   □ We respond to Google reviews within 48 hours
   □ We post to our Google Business Profile at least weekly
   □ Our website has separate pages for each service area we cover
   □ We currently run paid ads (Google, Facebook, etc.)

7. How do customers currently find you? *
   [multi-select chips]
   Options: Google Search | Referrals/Word of Mouth | Social Media | 
            Yard Signs | Home Advisor/Angi | Nextdoor | Paid Ads | Other

8. What's your biggest growth challenge? *
   [textarea, 2 lines]
   Placeholder: "e.g., Not enough leads, too much competition, can't rank on Google..."
```

**Submit button:** "Generate My Free Report →"

**Post-submit:** Show a loading animation with progress steps:
- "Analyzing your Google Business Profile..." (2s)
- "Benchmarking against local competitors..." (2s)
- "Auditing your website..." (2s)
- "Generating your personalized report..." (3s)
- "Report sent! Check your email." ✓

**Technical implementation:**
- Form posts to n8n webhook URL via fetch()
- Show progress animation for ~60-90 seconds (actual processing time)
- Poll a status endpoint OR just show timed animation + success message
- Include a simple reCAPTCHA v3 to prevent spam

### Section 4: Social Proof
- "Join 500+ local businesses who've optimized their AI presence" (update number as it grows)
- 3 testimonial cards (initially can use generic/placeholder)

### Section 5: Footer
- AgentLocal.ai branding
- Privacy policy link
- "Your data is never shared or sold"

---

## n8n Workflow: Node-by-Node Specification

### Node 1: Webhook Trigger

```
Type: Webhook
Method: POST
Path: /webhook/report
Authentication: None (public form)
Response Mode: "Respond to Webhook" (immediate 200 OK)
```

Response body (immediate, before processing):
```json
{
  "status": "processing",
  "message": "Your report is being generated. Check your email in about 2 minutes.",
  "lead_id": "{{$json.lead_id}}"
}
```

The workflow continues executing after the response is sent.

---

### Node 2: Validate & Store Lead

```
Type: Code (JavaScript)
```

```javascript
const input = $input.first().json.body;

// Validate required fields
const required = ['gbp_url', 'business_name', 'email', 'industry', 'customer_sources', 'growth_challenge'];
for (const field of required) {
  if (!input[field]) {
    throw new Error(`Missing required field: ${field}`);
  }
}

// Normalize GBP URL — handle various formats
let gbpUrl = input.gbp_url.trim();

// Extract place ID or CID if present
// Common formats:
//   https://maps.google.com/?cid=XXXXX
//   https://www.google.com/maps/place/BUSINESS+NAME/@lat,lng,...
//   https://maps.app.goo.gl/XXXX (short link)
//   https://g.page/XXXXX

// Parse survey checkboxes into booleans
const responds_to_reviews = input.assessment?.includes('reviews') || false;
const posts_weekly = input.assessment?.includes('posts') || false;
const has_service_pages = input.assessment?.includes('service_pages') || false;
const runs_paid_ads = input.assessment?.includes('paid_ads') || false;

return {
  email: input.email.trim().toLowerCase(),
  business_name: input.business_name.trim(),
  gbp_url: gbpUrl,
  industry: input.industry,
  monthly_budget: input.monthly_budget || 'Not specified',
  responds_to_reviews,
  posts_weekly,
  has_service_pages,
  runs_paid_ads,
  customer_sources: input.customer_sources, // array
  growth_challenge: input.growth_challenge.trim(),
  created_at: new Date().toISOString()
};
```

---

### Node 3: Store Lead in Supabase

```
Type: HTTP Request (Supabase REST API)
Method: POST
URL: {{$env.SUPABASE_URL}}/rest/v1/report_leads
Headers:
  apikey: {{$env.SUPABASE_ANON_KEY}}
  Authorization: Bearer {{$env.SUPABASE_ANON_KEY}}
  Content-Type: application/json
  Prefer: return=representation
Body: (pass validated fields from Node 2)
```

Returns the created record with its UUID `id`.

---

### Node 4: Scrape GBP Data

```
Type: HTTP Request
Method: GET
URL: https://serpapi.com/search.json
Query Parameters:
  engine: google_maps
  q: {{$json.business_name}} {{$json.city_from_url}}
  type: search
  api_key: {{$env.SERPAPI_KEY}}
```

**Alternative approach if the user provides a direct Maps URL:**

```
Type: HTTP Request  
Method: GET
URL: https://serpapi.com/search.json
Query Parameters:
  engine: google_maps
  data: !4m5!3m4!1s{{place_id}}!8m2!3d{{lat}}!4d{{lng}}
  type: place
  api_key: {{$env.SERPAPI_KEY}}
```

**What we extract (Code Node after the HTTP request):**

```javascript
const place = $input.first().json.place_results || $input.first().json.local_results?.[0];

if (!place) {
  throw new Error('Could not find Google Business Profile. Check URL.');
}

return {
  gbp: {
    name: place.title,
    address: place.address,
    phone: place.phone,
    website: place.website || null,
    rating: place.rating,
    review_count: place.reviews,
    type: place.type, // e.g. "Plumber"
    categories: place.extensions || [],
    hours: place.operating_hours || {},
    thumbnail: place.thumbnail,
    
    // GBP completeness signals
    has_website: !!place.website,
    has_phone: !!place.phone,
    has_hours: !!place.operating_hours,
    has_description: !!(place.description && place.description.length > 50),
    photo_count: place.photos_count || 0,
    
    // Review breakdown if available
    reviews_per_score: place.reviews_per_score || {},
    
    // Location data for competitor search
    gps_coordinates: place.gps_coordinates,
    place_id: place.place_id
  }
};
```

---

### Node 5: Scrape GBP Reviews (Sample)

```
Type: HTTP Request
Method: GET
URL: https://serpapi.com/search.json
Query Parameters:
  engine: google_maps_reviews
  place_id: {{$json.gbp.place_id}}
  sort_by: newestFirst
  api_key: {{$env.SERPAPI_KEY}}
```

**Post-processing Code Node:**

```javascript
const reviews = $input.first().json.reviews || [];

// Analyze review patterns
const totalReviews = reviews.length;
const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / (totalReviews || 1);

// Check response rate (does owner reply?)
const ownerResponses = reviews.filter(r => r.response).length;
const responseRate = totalReviews > 0 ? (ownerResponses / totalReviews) * 100 : 0;

// Most recent review date
const mostRecent = reviews[0]?.date || 'unknown';

// Extract sentiment themes (will be enhanced by Claude)
const lowRated = reviews.filter(r => r.rating <= 3);
const complaints = lowRated.map(r => r.snippet).join('\n');

return {
  review_analysis: {
    sample_size: totalReviews,
    avg_rating: Math.round(avgRating * 10) / 10,
    owner_response_rate: Math.round(responseRate),
    most_recent_review: mostRecent,
    low_rated_count: lowRated.length,
    complaint_snippets: complaints.substring(0, 2000) // cap length
  }
};
```

---

### Node 6: Scrape Local Competitors

```
Type: HTTP Request
Method: GET
URL: https://serpapi.com/search.json
Query Parameters:
  engine: google_maps
  q: {{$json.gbp.type || industry}} near {{$json.gbp.address}}
  api_key: {{$env.SERPAPI_KEY}}
```

**Post-processing Code Node:**

```javascript
const results = $input.first().json.local_results || [];
const myPlaceId = $json.gbp.place_id;

// Filter out the business itself, take top 5 competitors
const competitors = results
  .filter(r => r.place_id !== myPlaceId)
  .slice(0, 5)
  .map(r => ({
    name: r.title,
    rating: r.rating,
    review_count: r.reviews,
    type: r.type,
    has_website: !!r.website,
    address: r.address,
    position_in_results: r.position
  }));

// Compute benchmark averages
const avgCompetitorRating = competitors.reduce((s, c) => s + (c.rating || 0), 0) / (competitors.length || 1);
const avgCompetitorReviews = competitors.reduce((s, c) => s + (c.review_count || 0), 0) / (competitors.length || 1);

return {
  competitors,
  benchmark: {
    avg_rating: Math.round(avgCompetitorRating * 10) / 10,
    avg_review_count: Math.round(avgCompetitorReviews),
    leader_name: competitors[0]?.name || 'N/A',
    leader_reviews: competitors[0]?.review_count || 0,
    total_competitors_found: results.length - 1
  }
};
```

---

### Node 7: Website Audit

**Only runs if the business has a website URL on their GBP.**

```
Type: IF Node
Condition: {{$json.gbp.website}} is not empty
  → YES: Continue to audit
  → NO: Skip to report generation with website_audit = { has_website: false }
```

**HTTP Request Node:**

```
Type: HTTP Request
Method: GET
URL: {{$json.gbp.website}}
Options:
  Follow Redirects: true
  Timeout: 15000
  Full Response: true (we need headers)
```

**Post-processing Code Node:**

```javascript
const response = $input.first().json;
const html = response.body || '';
const headers = response.headers || {};
const url = response.url || $json.gbp.website;

// Security
const isHttps = url.startsWith('https');

// Mobile readiness
const hasViewport = /meta\s+name=["']viewport["']/i.test(html);

// Basic SEO signals
const hasTitle = /<title[^>]*>.+<\/title>/i.test(html);
const titleMatch = html.match(/<title[^>]*>(.+?)<\/title>/i);
const title = titleMatch ? titleMatch[1].trim() : '';
const hasMetaDescription = /meta\s+name=["']description["']/i.test(html);
const hasH1 = /<h1/i.test(html);

// Schema / structured data
const hasSchemaOrg = /schema\.org/i.test(html);
const hasLocalBusinessSchema = /LocalBusiness|Service|HomeAndConstructionBusiness/i.test(html);
const hasJsonLd = /application\/ld\+json/i.test(html);

// Conversion elements
const hasClickToCall = /tel:/i.test(html);
const hasContactForm = /form/i.test(html) && /(contact|quote|estimate|book|schedule)/i.test(html);
const hasChatWidget = /(tawk|intercom|drift|livechat|crisp|hubspot|tidio|zendesk)/i.test(html);

// Service area pages (check for location-specific content patterns)
const cityMentions = html.match(/(service|serving|area|location|city|cities|town|neighborhood)/gi) || [];
const hasServiceAreaContent = cityMentions.length >= 3;

// Page weight estimate
const htmlSize = new Blob([html]).size;
const isHeavy = htmlSize > 500000; // >500KB HTML is concerning

// NAP consistency check
const businessName = $json.gbp.name;
const businessPhone = $json.gbp.phone;
const nameOnSite = html.includes(businessName);
const phoneOnSite = businessPhone ? html.includes(businessPhone.replace(/[^0-9]/g, '').slice(-10)) : false;

return {
  website_audit: {
    has_website: true,
    url: url,
    is_https: isHttps,
    has_viewport: hasViewport,
    has_title: hasTitle,
    page_title: title,
    has_meta_description: hasMetaDescription,
    has_h1: hasH1,
    has_schema_org: hasSchemaOrg,
    has_local_business_schema: hasLocalBusinessSchema,
    has_json_ld: hasJsonLd,
    has_click_to_call: hasClickToCall,
    has_contact_form: hasContactForm,
    has_chat_widget: hasChatWidget,
    has_service_area_content: hasServiceAreaContent,
    html_size_kb: Math.round(htmlSize / 1024),
    is_heavy: isHeavy,
    nap_name_consistent: nameOnSite,
    nap_phone_consistent: phoneOnSite
  }
};
```

---

### Node 8: Generate Report via Claude

```
Type: HTTP Request
Method: POST
URL: https://api.anthropic.com/v1/messages
Headers:
  x-api-key: {{$env.ANTHROPIC_API_KEY}}
  anthropic-version: 2023-06-01
  content-type: application/json
```

**Request body:**

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 6000,
  "system": "You are a senior digital marketing strategist specializing in local business optimization and AI readiness assessments. You produce professional, data-driven reports that are actionable and specific — never generic. You write for business owners, not marketers, so use plain language. Every recommendation must be concrete: not 'improve your SEO' but 'add a page titled Plumbing Services in Littleton CO with these specific sections...' You ONLY output valid JSON. No markdown, no backticks, no preamble.",
  "messages": [
    {
      "role": "user",
      "content": "Generate an AI Readiness & Optimization Report for this local business.\n\n## BUSINESS INFO\nName: {{business_name}}\nIndustry: {{industry}}\nMonthly Budget: {{monthly_budget}}\n\n## GOOGLE BUSINESS PROFILE DATA\n{{JSON.stringify(gbp_data)}}\n\n## REVIEW ANALYSIS\n{{JSON.stringify(review_analysis)}}\n\n## COMPETITOR BENCHMARK (Top 5 Local Competitors)\n{{JSON.stringify(competitor_data)}}\n\n## WEBSITE AUDIT\n{{JSON.stringify(website_audit)}}\n\n## OWNER SURVEY RESPONSES\n- Responds to reviews within 48hrs: {{responds_to_reviews}}\n- Posts to GBP weekly: {{posts_weekly}}\n- Has service area pages on website: {{has_service_pages}}\n- Runs paid ads: {{runs_paid_ads}}\n- How customers find them: {{customer_sources}}\n- Biggest growth challenge: {{growth_challenge}}\n\n## REPORT STRUCTURE\n\nReturn this exact JSON structure:\n\n{\n  \"business_name\": \"...\",\n  \"report_date\": \"March 14, 2026\",\n  \"overall_score\": 0-100,\n  \"overall_grade\": \"A/B/C/D/F\",\n  \"overall_verdict\": \"One compelling sentence summarizing their position\",\n  \n  \"section_1_gbp_health\": {\n    \"score\": 0-10,\n    \"title\": \"Google Business Profile Health\",\n    \"summary\": \"2-3 sentence overview\",\n    \"findings\": [\n      {\n        \"item\": \"Profile Completeness\",\n        \"status\": \"good|warning|critical\",\n        \"detail\": \"Specific finding with data\",\n        \"fix\": \"Exact action to take, if needed\"\n      }\n    ],\n    \"review_health\": {\n      \"rating_vs_competitors\": \"above|at|below\",\n      \"review_count_vs_competitors\": \"above|at|below\",\n      \"response_rate_assessment\": \"...\",\n      \"recency_assessment\": \"...\"\n    }\n  },\n\n  \"section_2_competitive_position\": {\n    \"score\": 0-10,\n    \"title\": \"Competitive Position\",\n    \"summary\": \"2-3 sentence overview\",\n    \"rank_in_market\": \"Where they stand vs competitors\",\n    \"advantages\": [\"Things they do better than competitors\"],\n    \"gaps\": [\"Things competitors do that they don't\"],\n    \"nearest_threat\": {\n      \"name\": \"Competitor name\",\n      \"why\": \"Why this competitor is the biggest threat\"\n    },\n    \"quick_wins\": [\"Specific actions to leapfrog nearest competitor\"]\n  },\n\n  \"section_3_website\": {\n    \"score\": 0-10,\n    \"title\": \"Website & Conversion Readiness\",\n    \"summary\": \"2-3 sentence overview\",\n    \"findings\": [\n      {\n        \"item\": \"...\",\n        \"status\": \"good|warning|critical\",\n        \"detail\": \"...\",\n        \"fix\": \"...\"\n      }\n    ]\n  },\n\n  \"section_4_ai_readiness\": {\n    \"score\": 0-10,\n    \"title\": \"AI Readiness Score\",\n    \"summary\": \"2-3 sentence overview explaining what AI readiness means for their business\",\n    \"findings\": [\n      {\n        \"item\": \"AI Discoverability\",\n        \"status\": \"good|warning|critical\",\n        \"detail\": \"Can AI assistants (ChatGPT, Claude, Google AI) find and accurately describe this business when asked? Based on available structured data, content depth, and schema markup.\",\n        \"fix\": \"...\"\n      },\n      {\n        \"item\": \"Structured Data for AI\",\n        \"status\": \"good|warning|critical\",\n        \"detail\": \"Does the business have machine-readable data (schema.org, JSON-LD) that AI agents can parse?\",\n        \"fix\": \"...\"\n      },\n      {\n        \"item\": \"Content Depth\",\n        \"status\": \"good|warning|critical\",\n        \"detail\": \"Is there enough detailed, specific content for an AI to confidently recommend this business for specific services?\",\n        \"fix\": \"...\"\n      },\n      {\n        \"item\": \"Voice Search Readiness\",\n        \"status\": \"good|warning|critical\",\n        \"detail\": \"Is the business optimized for 'Hey Google, find me a plumber near me' type queries?\",\n        \"fix\": \"...\"\n      },\n      {\n        \"item\": \"AI Agent Integration\",\n        \"status\": \"good|warning|critical\",\n        \"detail\": \"Can AI-powered booking agents or assistants interact with this business programmatically?\",\n        \"fix\": \"This is where AgentLocal.ai comes in — it creates an AI-readable presence with a chat widget, structured data layer, and MCP server so AI agents can discover, understand, and interact with your business automatically.\"\n      }\n    ],\n    \"ai_simulation\": \"Write a short paragraph simulating what would happen if someone asked an AI assistant 'Find me a good {{industry}} near {{city}}' — would this business be recommended? Why or why not?\"\n  },\n\n  \"section_5_action_plan\": {\n    \"title\": \"Your 90-Day Action Plan\",\n    \"priority_1\": {\n      \"timeframe\": \"This Week\",\n      \"label\": \"Quick Win\",\n      \"actions\": [\n        {\n          \"action\": \"Specific action\",\n          \"effort\": \"15 min|1 hour|half day\",\n          \"impact\": \"high|medium\",\n          \"detail\": \"Step-by-step what to do\"\n        }\n      ],\n      \"estimated_impact\": \"What they can expect from doing this\"\n    },\n    \"priority_2\": {\n      \"timeframe\": \"This Month\",\n      \"label\": \"Competitive Positioning\",\n      \"actions\": [...],\n      \"estimated_impact\": \"...\"\n    },\n    \"priority_3\": {\n      \"timeframe\": \"This Quarter\",\n      \"label\": \"AI Readiness Buildout\",\n      \"actions\": [...],\n      \"estimated_impact\": \"...\"\n    }\n  },\n\n  \"agentlocal_cta\": {\n    \"headline\": \"A personalized headline for why this business specifically needs AgentLocal\",\n    \"body\": \"2-3 sentences connecting their specific weaknesses to what AgentLocal solves\",\n    \"score_improvement\": \"Your AI Readiness score could go from {{current}} to {{projected}} with AgentLocal\"\n  }\n}\n\n## SCORING RULES\n- overall_score = weighted average: GBP (25%) + Competitive (20%) + Website (25%) + AI Readiness (30%)\n- Each section 0-10, overall 0-100\n- Be honest and specific. Don't inflate scores to be nice. A business with no schema markup, 12 reviews, and no website gets a low score. That honesty is what makes the report valuable.\n- Every 'fix' must be actionable by a non-technical business owner OR clearly labeled 'needs a professional'\n- The AI Readiness section should make the case for why this matters NOW, not someday"
    }
  ]
}
```

---

### Node 9: Parse Report & Calculate Scores

```
Type: Code (JavaScript)
```

```javascript
const response = $input.first().json;
const content = response.content[0].text;

let report;
try {
  // Strip any accidental markdown backticks
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  report = JSON.parse(cleaned);
} catch (e) {
  throw new Error('Failed to parse Claude response as JSON: ' + e.message);
}

// Validate overall score
if (!report.overall_score || report.overall_score < 0 || report.overall_score > 100) {
  // Recalculate from section scores
  const gbp = report.section_1_gbp_health?.score || 5;
  const comp = report.section_2_competitive_position?.score || 5;
  const web = report.section_3_website?.score || 5;
  const ai = report.section_4_ai_readiness?.score || 5;
  report.overall_score = Math.round((gbp * 2.5) + (comp * 2) + (web * 2.5) + (ai * 3));
}

// Assign letter grade
const score = report.overall_score;
if (score >= 85) report.overall_grade = 'A';
else if (score >= 70) report.overall_grade = 'B';
else if (score >= 55) report.overall_grade = 'C';
else if (score >= 40) report.overall_grade = 'D';
else report.overall_grade = 'F';

return { report };
```

---

### Node 10: Build HTML Report (Premium Template)

**IMPORTANT:** The report template file `report-template.html` is provided alongside this blueprint. It contains the full premium design with animated SVG score rings, color-coded finding cards, competitor comparison tables, the AI simulation box, and the AgentLocal CTA block. The template uses sample data — the Code Node below injects real data from Claude's JSON output into the template structure.

**Design features of the premium template:**
- Dark gradient cover header with animated circular score gauge
- 4 mini gauge rings for section scores (GBP, Competition, Website, AI Ready)
- Color-coded findings (green/amber/red) with status icons and inline fix actions
- Competitor comparison table with rank badges, star ratings, and review bar charts
- AI Simulation box (dark theme, glowing animation) showing what happens when AI is asked to find the business
- Score-jump CTA (47 → 82) connecting current state to projected improvement
- Responsive design, print-optimized, Google Fonts (Instrument Serif + Outfit)
- Staggered fade-in animations on page load

```
Type: Code (JavaScript)
Purpose: Generate the premium HTML report by injecting Claude's report JSON into the template
```

```javascript
const report = $input.first().json.report;
const lead = $json; // lead data from earlier in the chain

// ─── HELPER FUNCTIONS ───


function statusColor(status) {
  switch(status) {
    case 'good': return { bg: '#ECFDF5', text: '#065F46', border: '#059669', icon: '✓' };
    case 'warning': return { bg: '#FFFBEB', text: '#92400E', border: '#D97706', icon: '!' };
    case 'critical': return { bg: '#FEF2F2', text: '#7F1D1D', border: '#DC2626', icon: '✕' };
    default: return { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF', icon: '•' };
  }
}

function scoreColor(score, max = 10) {
  const pct = (score / max) * 100;
  if (pct >= 70) return '#10B981';
  if (pct >= 45) return '#F59E0B';
  return '#EF4444';
}

function gradeClass(grade) {
  return `grade-${grade.charAt(0)}`;
}

// ─── BUILD FINDINGS HTML ───
function findingsHTML(findings) {
  return (findings || []).map(f => {
    const c = statusColor(f.status);
    return `
      <div class="finding finding-${f.status}">
        <div class="finding-icon">${c.icon}</div>
        <div class="finding-content">
          <div class="finding-label">${f.item}</div>
          <div class="finding-detail">${f.detail}</div>
          ${f.fix ? `<div class="finding-fix">${f.fix}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// ─── BUILD COMPETITOR TABLE ───
function competitorTableHTML(competitors, gbp, report) {
  // Merge business into competitor list at correct position
  const allBusinesses = [...(competitors || [])];
  const myBiz = {
    name: report.business_name,
    rating: gbp.rating,
    review_count: gbp.review_count,
    photo_count: gbp.photo_count,
    is_you: true
  };
  
  // Insert at position based on rank (from competitive section)
  const myRank = parseInt(report.section_2_competitive_position?.rank_in_market?.match(/(\d)/)?.[1] || allBusinesses.length + 1);
  allBusinesses.splice(Math.min(myRank - 1, allBusinesses.length), 0, myBiz);

  const maxReviews = Math.max(...allBusinesses.map(b => b.review_count || 0), 1);

  const rows = allBusinesses.map((b, i) => {
    const rank = i + 1;
    const isYou = b.is_you;
    const barWidth = Math.round(((b.review_count || 0) / maxReviews) * 60);
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : isYou ? 'rank-you' : '';
    
    return `
      <tr ${isYou ? 'class="you-row"' : ''}>
        <td><strong>${b.name}</strong>${isYou ? ' ← YOU' : ''}</td>
        <td><span class="star">★</span> ${b.rating || 'N/A'}</td>
        <td><span class="reviews-bar" style="width:${barWidth}px;${isYou ? ' background:var(--accent);' : ''}"></span>${b.review_count || 0}</td>
        <td>${b.photo_count || b.has_website ? '✓' : '—'}</td>
        <td><span class="comp-rank ${rankClass}">${rank}</span></td>
      </tr>`;
  }).join('');

  return `
    <table class="comp-table">
      <thead>
        <tr>
          <th>Business</th>
          <th>Rating</th>
          <th>Reviews</th>
          <th>Website</th>
          <th style="text-align:center">Rank</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── BUILD ACTION PLAN HTML ───
function actionPlanHTML(priority, phaseNum) {
  const phaseColors = { 1: { bg: '#DCFCE7', text: '#166534' }, 2: { bg: '#DBEAFE', text: '#1E40AF' }, 3: { bg: '#F3E8FF', text: '#6B21A8' } };
  const pc = phaseColors[phaseNum] || phaseColors[1];
  
  const actions = (priority.actions || []).map(a => `
    <div class="action-item">
      <div class="action-check"></div>
      <div class="action-text">
        <strong>${a.action}</strong>
        <span>${a.detail || ''}</span>
      </div>
      <div class="action-effort">⏱ ${a.effort}</div>
    </div>`).join('');

  return `
    <div class="action-phase phase-${phaseNum}">
      <div class="action-phase-header">
        <div class="action-phase-left">
          <div class="action-phase-badge" style="background:${pc.bg}; color:${pc.text};">${priority.timeframe}</div>
          <div class="action-phase-time">${priority.label}</div>
        </div>
        <div class="action-phase-impact">${priority.estimated_impact || ''}</div>
      </div>
      <div class="action-items">${actions}</div>
    </div>`;
}

// ─── MAIN SCORE RING COLOR ───
const overallColor = scoreColor(report.overall_score, 100);
const overallDash = report.overall_score;

// ─── SECTION SCORES ───
const s1 = report.section_1_gbp_health;
const s2 = report.section_2_competitive_position;
const s3 = report.section_3_website;
const s4 = report.section_4_ai_readiness;
const s5 = report.section_5_action_plan;

const s1Color = scoreColor(s1.score);
const s2Color = scoreColor(s2.score);
const s3Color = scoreColor(s3.score);
const s4Color = scoreColor(s4.score);

// ─── ADVANTAGES / GAPS ───
const advantagesHTML = (s2.advantages || []).map(a =>
  `<div style="font-size:13px; color:var(--green-text); margin:6px 0;">✓ ${a}</div>`
).join('');
const gapsHTML = (s2.gaps || []).map(g =>
  `<div style="font-size:13px; color:var(--red-text); margin:6px 0;">✕ ${g}</div>`
).join('');

// ─── CTA PROJECTED SCORE ───
const projectedScore = Math.min(100, report.overall_score + 35);

// ─── ASSEMBLE FULL HTML ───
// NOTE: The complete CSS is in the report-template.html file provided with this blueprint.
// The template below uses the SAME CSS classes and structure. In production, read the CSS
// from report-template.html or inline it here. Below we inline the full stylesheet.

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Readiness Report — ${report.business_name}</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
/* ══════════════════════════════════════════════════════════════
   PREMIUM REPORT STYLESHEET
   Copy the FULL <style> block from report-template.html here.
   It contains all CSS variables, animations (fadeUp, gaugeStroke,
   shimmer, pulseGlow), cover styles, gauge styles, finding card
   styles, competitor table styles, AI simulation box, action plan
   cards, CTA block, footer, print styles, and responsive breakpoints.
   
   The report-template.html file IS the reference implementation.
   ══════════════════════════════════════════════════════════════ */
${PREMIUM_CSS}
</style>
</head>
<body>
<div class="report-container">

  <!-- ════════ COVER HEADER ════════ -->
  <div class="cover">
    <div class="cover-topline">
      <div class="cover-brand">
        <div class="cover-brand-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <span class="cover-brand-name">AgentLocal.ai</span>
      </div>
      <span class="cover-date">${report.report_date}</span>
    </div>

    <div class="cover-label">AI Readiness &amp; Optimization Report</div>
    <div class="cover-business">${report.business_name}</div>
    <div class="cover-address">${lead.gbp?.address || ''} · ${lead.industry}</div>

    <div class="score-hero">
      <div class="score-ring">
        <svg viewBox="0 0 36 36">
          <path class="score-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          <path class="score-ring-value" stroke="${overallColor}" stroke-dasharray="${overallDash}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        </svg>
        <div class="score-ring-number">
          <span class="num">${report.overall_score}</span>
          <span class="of">of 100</span>
        </div>
      </div>
      <div class="score-meta">
        <div class="score-grade ${gradeClass(report.overall_grade)}">
          <span>●</span> Grade ${report.overall_grade}
        </div>
        <div class="score-verdict">${report.overall_verdict}</div>
      </div>
    </div>
  </div>

  <!-- ════════ MINI GAUGES BAR ════════ -->
  <div class="gauges-bar">
    ${[
      { score: s1.score, color: s1Color, label: 'GBP Health' },
      { score: s2.score, color: s2Color, label: 'Competition' },
      { score: s3.score, color: s3Color, label: 'Website' },
      { score: s4.score, color: s4Color, label: 'AI Ready' }
    ].map(g => \`
      <div class="gauge-item">
        <div class="gauge-mini-ring">
          <svg viewBox="0 0 36 36">
            <path class="gauge-mini-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
            <path class="gauge-mini-val" stroke="\${g.color}" stroke-dasharray="\${g.score * 10}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          </svg>
          <span class="gauge-mini-num">\${g.score}</span>
        </div>
        <div class="gauge-label">\${g.label}</div>
      </div>
    \`).join('')}
  </div>

  <div class="report-body">

    <!-- ════════ SECTION 1: GBP HEALTH ════════ -->
    <div class="section">
      <div class="section-header">
        <div class="section-header-left">
          <div class="section-num">1</div>
          <div class="section-title">${s1.title}</div>
        </div>
        <div class="section-score-badge">
          <span style="color:${s1Color};">${s1.score}/10</span>
          <div class="bar"><div class="bar-fill" style="width:${s1.score * 10}%;background:${s1Color};"></div></div>
        </div>
      </div>
      <div class="section-summary">${s1.summary}</div>
      ${findingsHTML(s1.findings)}
    </div>

    <!-- ════════ SECTION 2: COMPETITIVE POSITION ════════ -->
    <div class="section">
      <div class="section-header">
        <div class="section-header-left">
          <div class="section-num">2</div>
          <div class="section-title">${s2.title}</div>
        </div>
        <div class="section-score-badge">
          <span style="color:${s2Color};">${s2.score}/10</span>
          <div class="bar"><div class="bar-fill" style="width:${s2.score * 10}%;background:${s2Color};"></div></div>
        </div>
      </div>
      <div class="section-summary">${s2.summary}</div>

      <div style="background:var(--ink-05); padding:16px 20px; border-radius:12px; margin:12px 0;">
        <div style="font-size:13px; font-weight:600; color:var(--ink);">Market Position</div>
        <div style="font-size:13px; color:var(--ink-60); margin-top:4px;">${s2.rank_in_market || ''}</div>
      </div>

      ${competitorTableHTML(lead.competitors, lead.gbp || {}, report)}

      <div style="display:flex; gap:16px; margin-top:16px;">
        <div style="flex:1; background:var(--green-bg); padding:16px 20px; border-radius:12px;">
          <div style="font-size:12px; font-weight:700; color:var(--green-text); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Your Advantages</div>
          ${advantagesHTML}
        </div>
        <div style="flex:1; background:var(--red-bg); padding:16px 20px; border-radius:12px;">
          <div style="font-size:12px; font-weight:700; color:var(--red-text); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Gaps to Close</div>
          ${gapsHTML}
        </div>
      </div>
    </div>

    <!-- ════════ SECTION 3: WEBSITE ════════ -->
    <div class="section">
      <div class="section-header">
        <div class="section-header-left">
          <div class="section-num">3</div>
          <div class="section-title">${s3.title}</div>
        </div>
        <div class="section-score-badge">
          <span style="color:${s3Color};">${s3.score}/10</span>
          <div class="bar"><div class="bar-fill" style="width:${s3.score * 10}%;background:${s3Color};"></div></div>
        </div>
      </div>
      <div class="section-summary">${s3.summary}</div>
      ${findingsHTML(s3.findings)}
    </div>

    <!-- ════════ SECTION 4: AI READINESS ════════ -->
    <div class="section">
      <div class="section-header">
        <div class="section-header-left">
          <div class="section-num">4</div>
          <div class="section-title">${s4.title}</div>
        </div>
        <div class="section-score-badge">
          <span style="color:${s4Color};">${s4.score}/10</span>
          <div class="bar"><div class="bar-fill" style="width:${s4.score * 10}%;background:${s4Color};"></div></div>
        </div>
      </div>
      <div class="section-summary">${s4.summary}</div>
      ${findingsHTML(s4.findings)}

      <!-- AI Simulation Box -->
      <div class="ai-sim">
        <div class="ai-sim-label"><span class="dot"></span> AI Simulation</div>
        <div class="ai-sim-prompt">"Find me a reliable ${lead.industry} near ${lead.gbp?.address?.split(',').slice(-2, -1)[0]?.trim() || 'my area'}"</div>
        <div class="ai-sim-response">${s4.ai_simulation}</div>
      </div>
    </div>

    <!-- ════════ SECTION 5: ACTION PLAN ════════ -->
    <div class="section">
      <div class="section-header">
        <div class="section-header-left">
          <div class="section-num">5</div>
          <div class="section-title">${s5.title}</div>
        </div>
      </div>
      ${actionPlanHTML(s5.priority_1, 1)}
      ${actionPlanHTML(s5.priority_2, 2)}
      ${actionPlanHTML(s5.priority_3, 3)}
    </div>

    <!-- ════════ CTA BLOCK ════════ -->
    <div class="cta-block">
      <div class="cta-score-jump">
        <span class="cta-score-from">${report.overall_score}</span>
        <span class="cta-score-arrow">→</span>
        <span class="cta-score-to">${projectedScore}</span>
      </div>
      <div class="cta-headline">${report.agentlocal_cta?.headline || 'Make your business AI-ready'}</div>
      <div class="cta-body">${report.agentlocal_cta?.body || ''}</div>
      <a href="https://agentlocal.ai?ref=report&score=${report.overall_score}&industry=${lead.industry}" class="cta-button">
        Get Started with AgentLocal →
      </a>
    </div>

  </div><!-- /report-body -->

  <!-- ════════ FOOTER ════════ -->
  <div class="report-footer">
    <div class="footer-left">
      <strong>AgentLocal.ai</strong> · AI Readiness & Optimization Report
      <br>Generated for ${report.business_name} · ${report.report_date}
    </div>
    <div class="footer-right">
      <span class="footer-confidential">🔒 Confidential</span>
    </div>
  </div>

</div>
</body>
</html>`;

return { html, report };
```

**IMPLEMENTATION NOTE FOR CLAUDE CODE:**

The `${PREMIUM_CSS}` placeholder above must be replaced with the **full CSS from report-template.html**. There are two approaches:

1. **Inline approach (simpler):** Copy the entire `<style>` block from `report-template.html` and paste it where `${PREMIUM_CSS}` appears. This makes the Code Node self-contained.

2. **File-read approach (cleaner):** Store the CSS in a file on the n8n server and read it at runtime:
   ```javascript
   const fs = require('fs');
   const PREMIUM_CSS = fs.readFileSync('/path/to/report-styles.css', 'utf8');
   ```

The **report-template.html** file provided alongside this blueprint is the visual reference — it contains sample data for "Summit Plumbing Co." and renders the exact output quality we're targeting. Use it to verify the CSS works correctly, then parameterize with the Code Node above.

```

---

### Node 11: Generate PDF

```
Type: Execute Command
Command: 
  echo '{{$json.html}}' > /tmp/report_{{$json.lead_id}}.html && \
  npx puppeteer-core --no-sandbox \
    --print-to-pdf=/tmp/report_{{$json.lead_id}}.pdf \
    /tmp/report_{{$json.lead_id}}.html

ALTERNATIVE (lighter weight, no Puppeteer dependency):
  wkhtmltopdf --page-size Letter \
    --margin-top 10mm --margin-bottom 10mm \
    --margin-left 10mm --margin-right 10mm \
    /tmp/report_{{$json.lead_id}}.html \
    /tmp/report_{{$json.lead_id}}.pdf
```

**Note for implementation:** If Puppeteer is too heavy for the Render instance, use wkhtmltopdf or a lightweight API service like:
- html2pdf.app (API, free tier)
- Gotenberg (self-hosted Docker container)
- Or simply send the HTML report as the email body and skip PDF entirely for V1

---

### Node 12: Upload PDF to Storage

```
Type: HTTP Request (Supabase Storage)
Method: POST
URL: {{$env.SUPABASE_URL}}/storage/v1/object/reports/{{lead_id}}.pdf
Headers:
  apikey: {{$env.SUPABASE_SERVICE_KEY}}
  Authorization: Bearer {{$env.SUPABASE_SERVICE_KEY}}
  Content-Type: application/pdf
Body: Binary (PDF file contents)
```

Returns the public URL for the stored PDF.

---

### Node 13: Send Email via Resend

```
Type: HTTP Request
Method: POST
URL: https://api.resend.com/emails
Headers:
  Authorization: Bearer {{$env.RESEND_API_KEY}}
  Content-Type: application/json
```

```json
{
  "from": "AI Report <report@agentlocal.ai>",
  "to": "{{$json.email}}",
  "subject": "Your AI Readiness Score: {{$json.report.overall_score}}/100 — {{$json.business_name}}",
  "html": "{{$json.html}}",
  "attachments": [
    {
      "filename": "AI-Readiness-Report-{{$json.business_name}}.pdf",
      "path": "{{$json.pdf_url}}"
    }
  ],
  "tags": [
    { "name": "report_type", "value": "ai_readiness" },
    { "name": "industry", "value": "{{$json.industry}}" },
    { "name": "score", "value": "{{$json.report.overall_score}}" }
  ]
}
```

---

### Node 14: Update Lead Record in Supabase

```
Type: HTTP Request (Supabase REST API)
Method: PATCH
URL: {{$env.SUPABASE_URL}}/rest/v1/report_leads?id=eq.{{$json.lead_id}}
Headers:
  apikey: {{$env.SUPABASE_SERVICE_KEY}}
  Authorization: Bearer {{$env.SUPABASE_SERVICE_KEY}}
  Content-Type: application/json
  Prefer: return=minimal
Body:
{
  "gbp_data": {{gbp_data_json}},
  "competitor_data": {{competitor_data_json}},
  "website_audit_data": {{website_audit_json}},
  "report_json": {{report_json}},
  "report_pdf_url": "{{pdf_url}}",
  "overall_score": {{report.overall_score}},
  "report_sent_at": "{{new Date().toISOString()}}"
}
```

---

### Node 15: Trigger Follow-Up Sequence (Conditional)

```
Type: IF Node
Condition: report.overall_score < 60
  → YES: Schedule follow-up emails
  → NO: End (they're doing well, lighter touch)
```

**Follow-up workflow (separate n8n workflow triggered via internal webhook):**

```
[Wait Node: 2 days]
  → [Resend Email: "3 things your competitors are doing that you're not"]
     Content: Pull from report.section_2_competitive_position.gaps
     CTA: "Fix this in 5 minutes → AgentLocal.ai"
  → [Update Supabase: followup_stage = 1]

[Wait Node: 3 more days (day 5)]
  → [Resend Email: "How {{similar_business}} grew 40% in 90 days"]
     Content: Template case study matched to their industry
     CTA: "See how it works → AgentLocal.ai/demo"
  → [Update Supabase: followup_stage = 2]

[Wait Node: 5 more days (day 10)]
  → [Resend Email: "Your 90-day window is closing"]
     Content: Reference their specific action plan from the report
     CTA: "Let us automate your fixes → AgentLocal.ai"
  → [Update Supabase: followup_stage = 3]
```

---

## Self-Improving Loop Workflow

**Trigger:** Weekly cron, Sundays at 8am

```
[Cron Trigger]
    │
    ▼
[Supabase: Fetch all reports from past week]
    │
    ▼
[Code Node: Aggregate insights]
    │  - Average scores by section across all reports
    │  - Most common findings (which items are "critical" most often?)
    │  - Most common industries submitting
    │  - Score distribution
    ▼
[HTTP Request: GitHub trending + n8n community]
    │  - Scrape GitHub trending for: local-seo, google-business, schema-org, ai-agents
    │  - Check n8n template library for new local business workflows
    │  - Check SerpAPI changelog for new endpoints
    ▼
[Claude Sonnet: Weekly Analysis]
    │  Prompt: "Given these aggregate report results and these new tools/techniques,
    │  suggest improvements to our report generation prompt, new scoring criteria 
    │  we should add, and any new data sources that would improve report quality.
    │  Also flag: which report sections have the highest correlation with 
    │  users clicking the AgentLocal CTA?"
    ▼
[Airtable/Notion: Store improvement suggestions]
    │
    ▼
[Resend: Email weekly digest to Ryan]
    │  Subject: "Weekly Report Pipeline Insights — {{report_count}} reports generated"
    │  Content: Top findings, suggested prompt improvements, conversion data
```

---

## Environment Variables

```bash
# APIs
ANTHROPIC_API_KEY=sk-ant-...
SERPAPI_KEY=...
RESEND_API_KEY=re_...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Config
REPORT_FROM_EMAIL=report@agentlocal.ai
AGENTLOCAL_BASE_URL=https://agentlocal.ai
DEFAULT_FOLLOWUP_ENABLED=true

# Optional
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

---

## API Cost Per Report

| Service | Calls | Cost |
|---------|-------|------|
| SerpAPI — GBP lookup | 1 | $0.01 |
| SerpAPI — Reviews | 1 | $0.01 |
| SerpAPI — Competitor search | 1 | $0.01 |
| Claude Sonnet — Report gen | 1 (~3K in, ~4K out) | ~$0.04 |
| Resend — Email | 1 | $0.001 |
| **Total per report** | | **~$0.07** |

At $0.07/report, you can generate 14,000 reports for $1,000. The unit economics are absurd.

---

## Implementation Priority for Claude Code

### Phase 1: Core Pipeline (ship in a weekend)
1. Set up Supabase table (`report_leads`)
2. Build the n8n workflow (Nodes 1-14) 
3. Test with your own GBP and 2-3 local businesses you know
4. Simple landing page (even a single HTML file on Vercel)

### Phase 2: Polish (week 2)
5. Improve HTML report template styling
6. Add PDF generation
7. Build follow-up email sequence
8. Add reCAPTCHA to the form

### Phase 3: Growth (week 3+)
9. Self-improving loop workflow
10. A/B test report email subject lines
11. Add "share your report" social feature
12. White-label version for agencies

### Phase 4: AgentLocal Integration
13. Auto-create AgentLocal lead when report score < 50
14. Pre-fill AgentLocal onboarding with data from the report
15. Re-scan GBP monthly for businesses that signed up → show improvement

---

## Landing Page Implementation Notes

The landing page should be a single Next.js page (or static HTML) deployed to Vercel. Key implementation details:

- Form posts to n8n webhook via `fetch()` with `no-cors` or proper CORS headers on n8n
- After submit, show animated progress UI (timed, not actually polling) for ~90 seconds
- Final state shows "Check your email!" with confetti or checkmark animation
- Mobile-first design — most local business owners will see this on their phone
- Include a sample report screenshot/preview above the fold
- Add Google Analytics / Plausible for conversion tracking
- URL params for attribution: `?ref=linkedin`, `?ref=agentlocal`, `?ref=agency_name`

For the form's GBP URL field, add a helper tooltip or expandable section showing:
1. Go to Google Maps
2. Search for your business
3. Click the "Share" button
4. Copy the link
Include a screenshot of this flow.

---

## White-Label Configuration

For agency partners who want to resell this under their brand:

```javascript
// Add to webhook payload:
{
  "white_label": {
    "agency_name": "Smith Digital Marketing",
    "agency_logo_url": "https://...",
    "agency_color": "#2563EB",
    "agency_cta_url": "https://smithdigital.com/contact",
    "agency_cta_text": "Schedule a Free Strategy Call",
    "hide_agentlocal_branding": true
  }
}
```

The HTML report template checks for `white_label` config and swaps branding accordingly. Charge agencies $99/month for unlimited white-labeled reports — they use it as their own lead gen tool.
