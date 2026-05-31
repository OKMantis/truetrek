require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "GUEST_EMAIL constant is defined and is a non-empty string" do
    assert_kind_of String, User::GUEST_EMAIL
    assert_not User::GUEST_EMAIL.empty?
  end

  test "GUEST_EMAIL constant has a valid email format" do
    assert_match URI::MailTo::EMAIL_REGEXP, User::GUEST_EMAIL
  end

  test "GUEST_EMAIL constant value is guest@truetrek.com" do
    assert_equal "guest@truetrek.com", User::GUEST_EMAIL
  end

  test "a user with GUEST_EMAIL can be persisted" do
    guest = User.new(
      email: User::GUEST_EMAIL,
      password: "guest_demo_account_truetrek!",
      username: "Guest",
      city: "Barcelona"
    )
    assert guest.valid?
  end
end
