# Guest Login — Design Spec

**Date:** 2026-05-31
**Status:** Approved (with architect revisions)

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
2. User clicks "Continue as Guest" (rendered as a form button, not a link)
3. Browser sends `POST /guest_session`
4. `GuestSessionsController#create` checks if user is already signed in — if so, redirects to `root_path` immediately
5. Finds the guest user by `User::GUEST_EMAIL`
6. Calls `sign_in(:user, guest_user)` via Devise helper
7. Redirects to `root_path`
8. If guest user not found (seeds not run): redirect to sign-in with flash error

## Components

### Constant (`app/models/user.rb`)

Add a constant so seeds and the controller reference the same value:

```ruby
GUEST_EMAIL = "guest@truetrek.com"
```

### Seed user (`db/seeds.rb`)

Add alongside existing seeded users, using `User::GUEST_EMAIL` and a long random-looking password (not `123456`, to prevent direct login bypassing the guest button):

```ruby
User.create!(
  email: User::GUEST_EMAIL,
  password: "guest_demo_account_truetrek!",
  username: "Guest",
  city: "Barcelona"
)
```

### Route (`config/routes.rb`)

Use `POST` to prevent unintended session creation by crawlers or browser prefetch:

```ruby
post '/guest_session', to: 'guest_sessions#create', as: :guest_session
```

### Controller (`app/controllers/guest_sessions_controller.rb`)

```ruby
class GuestSessionsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized

  def create
    return redirect_to root_path if user_signed_in?

    guest = User.find_by(email: User::GUEST_EMAIL)
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

Add below the existing login form using `button_to` (renders a POST form, not a link):

```erb
<%= button_to "Continue as Guest", guest_session_path, method: :post, class: "auth-guest-btn" %>
```

## What's Not Changing

- `ApplicationController` — no changes to `authenticate_user!` or `skip_pundit?`
- Pundit policies — guest user is a normal user; all existing policies apply as-is
- No new policy file needed

## Architect Review Notes

- GET → POST: prevents bots/prefetch from inadvertently creating guest sessions
- `User::GUEST_EMAIL` constant: prevents seeds and controller from drifting out of sync
- Strong password on guest account: prevents direct login via the standard form
- Already-authenticated guard: prevents signed-in users from being silently replaced with the guest session
