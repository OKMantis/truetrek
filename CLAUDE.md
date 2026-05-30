# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrueTrek is a Rails 7.2 travel planning application where users can browse cities and places, create travel books (collections of places), and leave comments with photos. The app uses LLM-powered features to enhance place descriptions based on community feedback.

## Common Commands

```bash
# Start development server
bin/rails server

# Database operations
bin/rails db:migrate
bin/rails db:seed
bin/rails db:reset

# Run tests
bin/rails test
bin/rails test test/models/user_test.rb  # single test file

# Code quality
bin/rubocop                    # linting
bin/brakeman                   # security scan

# Rails console
bin/rails console

# Background job processing (Solid Queue)
bin/rails solid_queue:start
```

## Architecture

### Tech Stack
- Rails 7.2 with Hotwire (Turbo + Stimulus)
- PostgreSQL with pg_search for full-text search
- Devise authentication + Pundit authorization
- Bootstrap 5 + Font Awesome
- Cloudinary for image hosting (Active Storage)
- Geocoder with Nominatim for coordinates
- RubyLLM (OpenAI) for AI-powered description enhancement
- Solid Queue for background jobs + Mission Control dashboard

### Data Model

```
User (Devise auth)
├── has_one TravelBook
├── has_many Comments
├── has_many Votes
├── has_many Reports
├── has_one_attached avatar
└── attributes: username (required), city (required), admin (boolean)

TravelBook
├── belongs_to User
└── has_many Places through TravelBookPlaces (join table)

City
├── has_many Places
└── img attribute (string URL)

Place
├── belongs_to City
├── has_many Comments
├── has_many Reports
├── has_many_attached photo
├── geocoded_by :address
├── pg_search_scope on title, enhanced_description, comments
└── attributes: title, original_description, enhanced_description, address, lat/long

Comment
├── belongs_to Place
├── belongs_to User
├── belongs_to :parent (self-referential for replies)
├── has_many :replies (nested comments)
├── has_many Votes
├── has_many_attached photos
└── validates description: presence, minimum 20 chars

Vote
├── belongs_to User
├── belongs_to Comment
└── value: -1 or 1 (unique per user/comment)

Report
├── belongs_to User
├── belongs_to Place
├── enum status: pending, reviewed, resolved, dismissed
└── validates reason: presence, user uniqueness per place
```

### LLM Integration
- `RubyLLM` gem with custom tools in `app/tools/`
- `WikipediaTool` fetches place summaries from Wikipedia API
- `GeneratePlaceDescriptionJob` creates initial place descriptions when a new place is added
- `UpdateEnhancedDescriptionJob` regenerates place descriptions using positively-voted comments, prioritizing local resident insights; a comment's `ordering_key(local_bonus: 2)` ranks it — locals get +2 weight
- Descriptions broadcast updates via Turbo Streams to `place_#{id}` channel targeting `place_description` DOM id

### Authorization with Pundit
- All controllers include `Pundit::Authorization` via `ApplicationController`
- `verify_authorized` runs after all actions except index (unless skipped)
- `verify_policy_scoped` runs after index actions
- `Pundit::NotAuthorizedError` rescue is intentionally commented out in `ApplicationController` (not yet wired up)
- `skip_pundit?` exempts: Devise controllers, pages, mission_control, and `places/autocomplete`
- Admin controllers (`Admin::BaseController`) use `require_admin` before_action and skip Pundit
- Policy files in `app/policies/`

### Routes Structure
- Root: `cities#index`
- Nested: `cities/:city_id/places` for places within a city (index, show only)
- Nested: `cities/:city_id/places/:place_id/comments` for creating comments on existing places
- Nested: `comments/:comment_id/replies` for threaded replies
- Nested: `comments/:comment_id/vote` for upvote/downvote
- Nested: `places/:place_id/reports` for user-submitted place reports
- `travel_book_places` for managing user's saved places
- `/camera` for photo capture feature (stores blob in session, redirects to comment form)
- `/users/search` for user autocomplete (@mentions)
- `/jobs` Mission Control dashboard (admin only)
- `/admin` namespace for admin dashboard, reports management, and place moderation
- Place creation (`places#new`, `places#create`) is **not** nested under a city — city is determined by geocoding from camera GPS or user selection

### Camera → Place Creation Flow
1. `GET /camera` (`captures#new`) shows the camera UI
2. `POST /camera` (`captures#create`) stores the blob id and GPS coordinates in session: `session[:captured_blob_id]`, `session[:captured_latitude]`, `session[:captured_longitude]`
3. `places#new` reads these from session, reverse-geocodes the coordinates to pre-fill city and address, and passes `@camera_blob_id` to the form
4. `places#create` attaches the blob to the new place after saving

### Stimulus Controllers
Key JavaScript controllers in `app/javascript/controllers/`:
- `reply_toggle_controller.js` - Shows reply form
- `reply_form_controller.js` - Handles cancel button on reply form
- `replies_expand_controller.js` - Expands/collapses reply threads
- `mention_autocomplete_controller.js` - @mention dropdown in comments
- `map_controller.js` - Map integration
- `place_selector_controller.js` - Place selection UI
- `place_name_autocomplete_controller.js` - Place name suggestions (hits `places/autocomplete#index`)
- `address_autocomplete_controller.js` - Address autocomplete

### Devise Configuration
Custom permitted parameters in `ApplicationController`:
- Sign up: `username`, `city`, `avatar`
- Account update: `username`, `city`, `avatar`

## Environment Variables

Uses `dotenv-rails`. Requires `.env` file with:
```
CLOUDINARY_URL=
OPENAI_API_KEY=
```
