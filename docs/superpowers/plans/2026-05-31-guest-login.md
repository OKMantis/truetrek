# Guest Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-click "Continue as Guest" POST button to the login page that signs any visitor in as a shared demo account with full user privileges.

**Architecture:** A dedicated `GuestSessionsController` skips Devise's `authenticate_user!` and Pundit's `verify_authorized`, finds the guest user by `User::GUEST_EMAIL`, and calls Devise's `sign_in` helper. A `button_to` on the login page POSTs to this route (not a link, to prevent bot/prefetch triggering).

**Tech Stack:** Rails 7.2, Devise (`sign_in` helper), Pundit, Bootstrap 5, Rails integration tests (`ActionDispatch::IntegrationTest`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `app/models/user.rb` | Add `GUEST_EMAIL` constant |
| Modify | `db/seeds.rb` | Add guest user record |
| Modify | `config/routes.rb` | Add `post '/guest_session'` route |
| Create | `app/controllers/guest_sessions_controller.rb` | Handle guest sign-in logic |
| Modify | `app/views/devise/sessions/new.html.erb` | Add "Continue as Guest" button |
| Create | `test/controllers/guest_sessions_controller_test.rb` | Integration tests for all three scenarios |

---

## Task 1: Add `GUEST_EMAIL` constant and seed the guest user

**Files:**
- Modify: `app/models/user.rb`
- Modify: `db/seeds.rb`

- [ ] **Step 1: Add the constant to the User model**

Open `app/models/user.rb`. Add this line immediately after the class declaration, before the `devise` call:

```ruby
class User < ApplicationRecord
  GUEST_EMAIL = "guest@truetrek.com"

  devise :database_authenticatable, :registerable,
  # ... rest unchanged
```

- [ ] **Step 2: Add the guest user to seeds**

Open `db/seeds.rb`. Find the block of `User.create!` calls (around line 75). Add this entry at the end of that block:

```ruby
User.create!(
  email: User::GUEST_EMAIL,
  password: "guest_demo_account_truetrek!",
  username: "Guest",
  city: "Barcelona"
)
puts "Created Guest user"
```

- [ ] **Step 3: Re-seed the database**

```bash
bin/rails db:seed
```

Expected: No errors. Output includes `Created Guest user`.

- [ ] **Step 4: Verify in the Rails console**

```bash
bin/rails console
```

```ruby
User.find_by(email: User::GUEST_EMAIL)
# => #<User id=... email="guest@truetrek.com" username="Guest" ...>
```

Type `exit` to leave the console.

- [ ] **Step 5: Commit**

```bash
git add app/models/user.rb db/seeds.rb
git commit -m "feat: add GUEST_EMAIL constant and seed guest user"
```

---

## Task 2: Add the guest session route

**Files:**
- Modify: `config/routes.rb`

- [ ] **Step 1: Add the route**

Open `config/routes.rb`. Add this line after `root to: "cities#index"`:

```ruby
post '/guest_session', to: 'guest_sessions#create', as: :guest_session
```

- [ ] **Step 2: Verify the route exists**

```bash
bin/rails routes | grep guest_session
```

Expected output:
```
guest_session POST /guest_session(.:format) guest_sessions#create
```

- [ ] **Step 3: Commit**

```bash
git add config/routes.rb
git commit -m "feat: add POST /guest_session route"
```

---

## Task 3: Create GuestSessionsController with tests (TDD)

**Files:**
- Create: `test/controllers/guest_sessions_controller_test.rb`
- Create: `app/controllers/guest_sessions_controller.rb`

- [ ] **Step 1: Write the failing tests**

Create `test/controllers/guest_sessions_controller_test.rb`:

```ruby
require "test_helper"

class GuestSessionsControllerTest < ActionDispatch::IntegrationTest
  include Devise::Test::IntegrationHelpers

  setup do
    @guest = User.create!(
      email: User::GUEST_EMAIL,
      password: "guest_demo_account_truetrek!",
      username: "Guest",
      city: "Barcelona"
    )
  end

  teardown do
    User.find_by(email: User::GUEST_EMAIL)&.destroy
  end

  test "signs in as guest and redirects to root" do
    post guest_session_path
    assert_redirected_to root_path
  end

  test "when already signed in, redirects to root without replacing session" do
    other = User.create!(email: "other@example.com", password: "password123!", username: "Other", city: "Paris")
    sign_in other
    post guest_session_path
    assert_redirected_to root_path
    other.destroy
  end

  test "when guest user is missing, redirects to sign in with alert" do
    @guest.destroy
    post guest_session_path
    assert_redirected_to new_user_session_path
    assert_equal "Guest account not available.", flash[:alert]
  end
end
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
bin/rails test test/controllers/guest_sessions_controller_test.rb
```

Expected: 3 errors — `uninitialized constant GuestSessionsController` (or routing error).

- [ ] **Step 3: Create the controller**

Create `app/controllers/guest_sessions_controller.rb`:

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

- [ ] **Step 4: Run tests to confirm they pass**

```bash
bin/rails test test/controllers/guest_sessions_controller_test.rb
```

Expected:
```
3 runs, 3 assertions, 0 failures, 0 errors, 0 skips
```

- [ ] **Step 5: Run the full test suite to check for regressions**

```bash
bin/rails test
```

Expected: All tests pass (existing tests were already stubs, so no regressions).

- [ ] **Step 6: Commit**

```bash
git add app/controllers/guest_sessions_controller.rb test/controllers/guest_sessions_controller_test.rb
git commit -m "feat: add GuestSessionsController with tests"
```

---

## Task 4: Add "Continue as Guest" button to the login page

**Files:**
- Modify: `app/views/devise/sessions/new.html.erb`

- [ ] **Step 1: Add the button below the login form**

Open `app/views/devise/sessions/new.html.erb`. Find the `<div class="auth-footer-links">` block at the bottom and add the guest button above it:

```erb
      <div class="auth-guest">
        <%= button_to "Continue as Guest", guest_session_path, method: :post, class: "auth-guest-btn" %>
      </div>

      <div class="auth-footer-links">
        <%= link_to "Forgot your password?", new_password_path(resource_name) %>
      </div>
```

- [ ] **Step 2: Start the server and verify manually**

```bash
bin/rails server
```

Open `http://localhost:3000`. You should be redirected to the login page. Confirm:
1. A "Continue as Guest" button appears below the login form
2. Clicking it signs you in and lands you on the cities index
3. The nav shows you're logged in as "Guest"
4. Clicking it again (while signed in as Guest) redirects to root without error

- [ ] **Step 3: Commit**

```bash
git add app/views/devise/sessions/new.html.erb
git commit -m "feat: add Continue as Guest button to login page"
```
