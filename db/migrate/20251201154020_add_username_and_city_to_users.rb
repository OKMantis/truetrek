class AddUsernameAndCityToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :city, :string
    add_column :users, :username, :string
  end
end
