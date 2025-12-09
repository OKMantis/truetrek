class Places::SuggestionsController < ApplicationController
  skip_before_action :authenticate_user!
  skip_before_action :verify_authenticity_token, only: [:create]
  skip_after_action :verify_authorized

  def create
    query = params[:query]
    city = params[:city]

    if query.blank? || query.length < 3
      render json: { suggestions: [] }
      return
    end

    begin
      chat = RubyLLM.chat

      prompt = if city.present?
                 <<~PROMPT
                   Suggest 5 real tourist attractions, landmarks, or points of interest in #{city} that match the query "#{query}".

                   Return ONLY a JSON array of objects, each with:
                   - "name": the place name (short, e.g., "Sagrada Familia")
                   - "address": full address including city and country
                   - "latitude": approximate latitude (number)
                   - "longitude": approximate longitude (number)

                   Example format:
                   [
                     {
                       "name": "Sagrada Familia",
                       "address": "Carrer de Mallorca, 401, 08013 Barcelona, Spain",
                       "latitude": 41.4036,
                       "longitude": 2.1744
                     }
                   ]

                   Return ONLY the JSON array, no other text.
                 PROMPT
               else
                 <<~PROMPT
                   Suggest 5 real famous tourist attractions, landmarks, or points of interest worldwide that match the query "#{query}".

                   Return ONLY a JSON array of objects, each with:
                   - "name": the place name (short, e.g., "Eiffel Tower")
                   - "address": full address including city and country
                   - "latitude": approximate latitude (number)
                   - "longitude": approximate longitude (number)

                   Example format:
                   [
                     {
                       "name": "Eiffel Tower",
                       "address": "Champ de Mars, 5 Av. Anatole France, 75007 Paris, France",
                       "latitude": 48.8584,
                       "longitude": 2.2945
                     }
                   ]

                   Return ONLY the JSON array, no other text.
                 PROMPT
               end

      response = chat.ask(prompt)

      # Parse the JSON response
      suggestions = JSON.parse(response.content)

      render json: { suggestions: suggestions }
    rescue JSON::ParserError => e
      Rails.logger.error "Failed to parse LLM response: #{e.message}"
      render json: { suggestions: [], error: "Failed to parse suggestions" }
    rescue StandardError => e
      Rails.logger.error "Error getting place suggestions: #{e.message}"
      render json: { suggestions: [], error: "Failed to get suggestions" }
    end
  end
end
