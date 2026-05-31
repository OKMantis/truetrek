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
