class GuestSessionsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_after_action :verify_authorized
  skip_after_action :verify_policy_scoped

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
