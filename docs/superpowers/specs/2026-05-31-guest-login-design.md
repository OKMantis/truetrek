# Guest Login — Design Spec

**Date:** 2026-05-31
**Status:** Approved

## Problem

For demo purposes, visitors without credentials can't access the app at all. Every route is protected by `authenticate_user!`, so there's no way to explore TrueTrek without an account.

## Goal

Add a one-click "Continue as Guest" button to the login page that signs the user in as a shared demo account with full user privileges.

## Scope

- Single shared guest account (not per-session temporary accounts)
- Guest has full access: can browse, comment, vote, save places, etc.
- Entry point is the existing login page only

## Flow

1. Unauthenticated user arrives at `/users/sign_in`
2. User clicks "Continue as Guest"
3. Browser sends `GET /guest_session`
4. `GuestSessionsController#create` finds the guest user by email
5. Calls `sign_in(:user, guest_user)` via Devise helper
6. Redirects to `root_path`
7. If guest user not found (seeds not run): redirect to sign-in with flash error

## Components

### Seed user (`db/seeds.rb`)

Add alongside existing seeded users:

```ruby
User.create!(
  email: "guest@truetrek.com",
  password: "123456",
  username: "Guest",
  city: "Barcelona"
)
```

### Route (`config/routes.rb`)

```ruby
get '/guest_session', to: 'guest_sessions#create', as: :guest_session
```

### Controller (`app/controllers/guest_sessions_controller.rb`)

```ruby
class GuestSessionsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def create
    guest = User.find_by(email: "guest@truetrek.com")
    if guest
      sign_in(:user, guest)
      redirect_to root_path
    else
      redirect_to new_user_session_path, alert: "Guest account not available."
    end
  end
end
```

### Login page (`app/views/devise/sessions/new.html.erb`)

Add a "Continue as Guest" button/link below the existing login form, pointing to `guest_session_path`.

## What's Not Changing

- `ApplicationController` — no changes to `authenticate_user!` or `skip_pundit?`
- Pundit policies — guest user is a normal user; all existing policies apply as-is
- No new policy file needed
