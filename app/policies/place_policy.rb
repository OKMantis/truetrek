class PlacePolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      scope.all
    end
  end

  def show?
    true
  end

  def destroy?
    user&.admin?
  end

  def edit?
    user&.admin?
  end

  def update?
    user&.admin?
  end
end
