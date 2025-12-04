class UpdateEnhancedDescriptionJob < ApplicationJob
  queue_as :default

  ENHANCEMENT_PROMPT = <<~PROMPT.freeze
    You are a helpful travel assistant that provides concise, engaging summaries about places.
    Create informative but brief descriptions (2-3 paragraphs max).
    Incorporate visitor experiences naturally into the description.
    IMPORTANT: Give significantly more weight to insights from LOCAL residents, as they have
    deeper knowledge of the place. Local insights should be prominently featured.
  PROMPT

  def perform(place_id)
    place = Place.find_by(id: place_id)
    return unless place

    all_comments = place.comments.includes(:votes, :user)
    positive_comments = all_comments.where(parent_id: nil).select(&:positive_vote_balance?)
    positive_replies = all_comments.where.not(parent_id: nil).select(&:positive_vote_balance?)

    if positive_comments.empty? && positive_replies.empty?
      place.update(enhanced_description: place.original_description)
      return
    end

    regenerate_description(place, positive_comments, positive_replies)
  rescue StandardError => e
    Rails.logger.error("UpdateEnhancedDescriptionJob failed for place #{place_id}: #{e.message}")
  end

  private

  def regenerate_description(place, positive_comments, positive_replies)
    chat = RubyLLM.chat
    chat.with_instructions(ENHANCEMENT_PROMPT)

    all_positive = positive_comments + positive_replies
    local_experiences = all_positive.select(&:user_is_local?)
    visitor_experiences = all_positive.reject(&:user_is_local?)

    sections = []

    if local_experiences.any?
      local_texts = local_experiences.map { |c| format_experience(c) }
      sections << "LOCAL INSIGHTS (from residents - HIGH PRIORITY):\n#{local_texts.join("\n\n")}"
    end

    if visitor_experiences.any?
      visitor_texts = visitor_experiences.map { |c| format_experience(c) }
      sections << "VISITOR EXPERIENCES:\n#{visitor_texts.join("\n\n")}"
    end

    prompt = <<~MSG
      Here is the base description of #{place.title}:
      #{place.original_description}

      Here are verified experiences (with positive community votes):
      #{sections.join("\n\n")}

      Please create an enhanced description that incorporates these experiences naturally.
      Prioritize and highlight insights from LOCAL residents as they have authentic knowledge.
      Keep it concise (2-3 paragraphs max).
    MSG

    response = chat.ask(prompt)
    place.update(enhanced_description: response.content)
  end

  def format_experience(comment)
    prefix = comment.user_is_local? ? "[LOCAL] " : ""
    "#{prefix}#{comment.user&.username || 'A visitor'}: '#{comment.description}'"
  end
end
