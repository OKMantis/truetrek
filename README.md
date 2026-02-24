# TrueTrek

A Rails 7.2 travel planning application where users can browse cities and places, create travel books (collections of places), and leave comments with photos. The app uses LLM-powered features to enhance place descriptions based on community feedback.

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

## Tech Stack

- **Framework**: Rails 7.2 with Hotwire (Turbo + Stimulus)
- **Database**: PostgreSQL with pg_search for full-text search
- **Authentication**: Devise
- **Authorization**: Pundit
- **Frontend**: Bootstrap 5 + Font Awesome
- **Image Hosting**: Cloudinary (Active Storage)
- **Geocoding**: Geocoder with Nominatim
- **AI**: RubyLLM for description enhancement
- **Background Jobs**: Solid Queue + Mission Control dashboard

## Setup

### Prerequisites

- Ruby (see `.ruby-version`)
- PostgreSQL
- A `.env` file with the required credentials (see below)

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd truetrek

# Install dependencies
bundle install

# Setup database
bin/rails db:create db:migrate db:seed

# Start the server
bin/rails server
```

### Environment Variables

Create a `.env` file in the root directory with:

```
# Cloudinary
CLOUDINARY_URL=

# LLM (RubyLLM)
OPENAI_API_KEY=
```

## Common Commands

```bash
# Start development server
bin/rails server

# Run database migrations
bin/rails db:migrate

# Seed the database
bin/rails db:seed

# Reset the database
bin/rails db:reset

# Run tests
bin/rails test
bin/rails test test/models/user_test.rb  # single test file

# Linting
bin/rubocop

# Security scan
bin/brakeman

# Rails console
bin/rails console

# Background job processing
bin/rails solid_queue:start
```

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

## LLM Integration

- `GeneratePlaceDescriptionJob` — creates an initial AI-generated description when a new place is added
- `UpdateEnhancedDescriptionJob` — regenerates descriptions using positively-voted comments, prioritizing local resident insights
- `WikipediaTool` — fetches place summaries from the Wikipedia API
- Description updates are broadcast via Turbo Streams to the relevant place channel

## Admin

Admins have access to:
- `/admin` — dashboard
- `/admin/reports` — manage user-submitted reports
- `/jobs` — Mission Control background job dashboard
