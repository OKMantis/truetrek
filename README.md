# TrueTrek

A travel planning app where users browse cities and places, build personal travel books, and leave comments with photos. Community feedback is used to keep place descriptions fresh through AI-powered enhancement.

Built as a 2-week team project at Le Wagon's AI Software Development Bootcamp (2025), working collaboratively across product, design, and engineering.

**[Live demo](https://your-demo-url-here)** (add if applicable)

---

## Features

- Browse cities and places with rich descriptions
- Create personal travel books (saved collections of places)
- Leave comments with photos on places
- Threaded replies and @mention support in comments
- Upvote/downvote comments
- Report places for moderation
- AI-powered place description enhancement using community feedback
- Full-text search across places and comments
- Photo capture via camera
- Admin dashboard with report and place moderation
- Background job processing with Mission Control dashboard

---

## Tech Stack

- **Framework**: Rails 7.2 with Hotwire (Turbo + Stimulus)
- **Database**: PostgreSQL with pg_search for full-text search
- **Authentication**: Devise
- **Authorization**: Pundit
- **Frontend**: Bootstrap 5 + Font Awesome
- **Image Hosting**: Cloudinary (Active Storage)
- **Geocoding**: Geocoder with Nominatim
- **AI**: RubyLLM with OpenAI for description enhancement
- **Background Jobs**: Solid Queue + Mission Control dashboard

---

## LLM Integration

Place descriptions are enhanced automatically using community input:

- `GeneratePlaceDescriptionJob` — creates an initial AI-generated description when a new place is added
- `UpdateEnhancedDescriptionJob` — regenerates descriptions using positively-voted comments, prioritising local resident insights
- `WikipediaTool` — fetches place summaries from the Wikipedia API as additional context
- Description updates are broadcast live via Turbo Streams to the relevant place channel

---

## Data Model

```
User (Devise auth)
├── has_one TravelBook
├── has_many Comments
├── has_many Votes
├── has_many Reports
└── attributes: username, city, admin

TravelBook
├── belongs_to User
└── has_many Places through TravelBookPlaces

City
└── has_many Places

Place
├── belongs_to City
├── has_many Comments
├── has_many Reports
└── attributes: title, original_description, enhanced_description, address, lat/long

Comment
├── belongs_to Place
├── belongs_to User
├── belongs_to :parent (self-referential for replies)
└── has_many Votes

Vote
├── belongs_to User
├── belongs_to Comment
└── value: -1 or 1

Report
├── belongs_to User
├── belongs_to Place
└── enum status: pending, reviewed, resolved, dismissed
```

---

## Setup

### Prerequisites

- Ruby (see `.ruby-version`)
- PostgreSQL
- A `.env` file with the required credentials (see below)

### Installation

```bash
git clone <repo-url>
cd truetrek
bundle install
bin/rails db:create db:migrate db:seed
bin/rails server
```

### Environment Variables

Create a `.env` file in the root:

```
CLOUDINARY_URL=
OPENAI_API_KEY=
```

---

## Common Commands

```bash
bin/rails server          # Start development server
bin/rails db:migrate      # Run migrations
bin/rails db:seed         # Seed the database
bin/rails test            # Run tests
bin/rubocop               # Linting
bin/brakeman              # Security scan
bin/rails solid_queue:start  # Background job processing
```

---

## Routes

| Path | Description |
|------|-------------|
| `/` | Cities index |
| `/cities/:city_id/places` | Places within a city |
| `/cities/:city_id/places/:place_id/comments` | Comments on a place |
| `/comments/:comment_id/replies` | Threaded replies |
| `/comments/:comment_id/vote` | Upvote/downvote |
| `/places/:place_id/reports` | Submit a place report |
| `/travel_book_places` | Manage saved places |
| `/camera` | Photo capture |
| `/users/search` | User autocomplete for @mentions |
| `/jobs` | Mission Control (admin only) |
| `/admin` | Admin dashboard |
