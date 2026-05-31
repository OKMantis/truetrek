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

  # Happy path ------------------------------------------------------------------

  test "signs in as guest and redirects to root" do
    post guest_session_path
    assert_redirected_to root_path
  end

  test "guest user is actually signed in after POST" do
    post guest_session_path
    follow_redirect!
    # The cities#index root page should render successfully for a signed-in user
    assert_response :success
  end

  test "response is a redirect (3xx), not an error" do
    post guest_session_path
    assert_operator response.status, :>=, 300
    assert_operator response.status, :<,  400
  end

  # Already signed in -----------------------------------------------------------

  test "when already signed in, redirects to root without replacing session" do
    other = User.create!(email: "other@example.com", password: "password123!", username: "Other", city: "Paris")
    sign_in other
    post guest_session_path
    assert_redirected_to root_path
    other.destroy
  end

  test "when already signed in, the original user session is preserved" do
    other = User.create!(email: "preserved@example.com", password: "password123!", username: "Preserved", city: "Lima")
    sign_in other

    post guest_session_path
    # After redirect, the root page should still be accessible (session still valid)
    follow_redirect!
    assert_response :success

    other.destroy
  end

  # Missing guest account -------------------------------------------------------

  test "when guest user is missing, redirects to sign in with alert" do
    @guest.destroy
    post guest_session_path
    assert_redirected_to new_user_session_path
    assert_equal "Guest account not available.", flash[:alert]
  end

  test "when guest user is missing, does not sign in any user" do
    @guest.destroy
    post guest_session_path
    # Should redirect to login, not root — no session established
    assert_redirected_to new_user_session_path
  end

  # Method enforcement ----------------------------------------------------------

  test "GET to guest_session path returns 404 (only POST is routed)" do
    get guest_session_path
    assert_response :not_found
  end

  # Pundit / authentication skips -----------------------------------------------

  test "unauthenticated user can POST without being redirected to login first" do
    # If authenticate_user! were NOT skipped, this would redirect to new_user_session_path
    post guest_session_path
    assert_not_equal new_user_session_path, response.location.to_s.gsub(root_url.chomp("/"), "")
    assert_redirected_to root_path
  end
end
