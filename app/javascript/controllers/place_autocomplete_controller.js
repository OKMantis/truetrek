import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="place-autocomplete"
export default class extends Controller {
  static targets = ["titleInput", "address", "latitude", "longitude", "citySelect", "geocoderContainer", "hint"]

  connect() {
    this.selectedCity = null
    this.debounceTimer = null
    this.suggestionsDropdown = null
    this.#initializeAutocomplete()
  }

  cityChanged() {
    const select = this.citySelectTarget
    const selectedOption = select.options[select.selectedIndex]

    if (selectedOption && selectedOption.value) {
      this.selectedCity = selectedOption.text
      this.#showHint(`Search for places in ${this.selectedCity}`)
    } else {
      this.selectedCity = null
      this.#showHint("Search for places anywhere")
    }
  }

  #initializeAutocomplete() {
    // Use the existing title input field
    if (!this.hasTitleInputTarget) return

    const input = this.titleInputTarget

    // Add input event listener for typing
    input.addEventListener('input', (e) => {
      this.#handleInput(e.target.value)
    })

    // Add click outside to close dropdown
    document.addEventListener('click', (e) => {
      if (!this.geocoderContainerTarget.contains(e.target)) {
        this.#closeSuggestions()
      }
    })

    // Set initial city bias if already selected
    if (this.hasCitySelectTarget) {
      const select = this.citySelectTarget
      const selectedOption = select.options[select.selectedIndex]
      if (selectedOption && selectedOption.value) {
        this.selectedCity = selectedOption.text
      }
    }

    // Store input reference
    this.inputElement = input
  }

  #handleInput(value) {
    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Close suggestions if input is too short
    if (value.length < 3) {
      this.#closeSuggestions()
      return
    }

    // Show loading hint
    this.#showHint('<i class="fa-solid fa-spinner fa-spin"></i> Searching...')

    // Debounce the API call
    this.debounceTimer = setTimeout(() => {
      this.#fetchSuggestions(value)
    }, 500)
  }

  async #fetchSuggestions(query) {
    try {
      const response = await fetch('/places/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          query: query,
          city: this.selectedCity
        })
      })

      const data = await response.json()

      if (data.suggestions && data.suggestions.length > 0) {
        this.#displaySuggestions(data.suggestions)
        this.#showHint(`${data.suggestions.length} places found`)
      } else {
        this.#closeSuggestions()
        this.#showHint('No places found. Try a different search.')
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      this.#showHint('Error loading suggestions. Please try again.')
    }
  }

  #displaySuggestions(suggestions) {
    // Remove existing dropdown
    this.#closeSuggestions()

    // Create dropdown container
    const dropdown = document.createElement('div')
    dropdown.className = 'autocomplete-suggestions'
    dropdown.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-top: 4px;
    `

    // Add suggestions
    suggestions.forEach(suggestion => {
      const item = document.createElement('div')
      item.className = 'autocomplete-item'
      item.style.cssText = `
        padding: 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      `
      item.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${suggestion.name}</div>
        <div style="font-size: 0.875rem; color: #666;">${suggestion.address}</div>
      `

      // Hover effect
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f5f5f5'
      })
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'white'
      })

      // Click handler
      item.addEventListener('click', () => {
        this.#selectPlace(suggestion)
      })

      dropdown.appendChild(item)
    })

    // Make container relative
    this.geocoderContainerTarget.style.position = 'relative'
    this.geocoderContainerTarget.appendChild(dropdown)
    this.suggestionsDropdown = dropdown
  }

  #selectPlace(place) {
    // Update input field (which is the title field)
    if (this.inputElement) {
      this.inputElement.value = place.name
    }

    // Set address
    if (this.hasAddressTarget) {
      this.addressTarget.value = place.address
    }

    // Set coordinates
    if (this.hasLatitudeTarget && this.hasLongitudeTarget) {
      this.latitudeTarget.value = place.latitude
      this.longitudeTarget.value = place.longitude
    }

    // Auto-select city if not already selected
    if (this.hasCitySelectTarget && !this.selectedCity) {
      const cityFromAddress = this.#extractCityFromAddress(place.address)
      if (cityFromAddress) {
        const citySelect = this.citySelectTarget
        for (let i = 0; i < citySelect.options.length; i++) {
          if (citySelect.options[i].text.toLowerCase().includes(cityFromAddress.toLowerCase())) {
            citySelect.selectedIndex = i
            this.selectedCity = citySelect.options[i].text
            break
          }
        }
      }
    }

    this.#closeSuggestions()
    this.#showHint('<i class="fa-solid fa-check-circle"></i> Place selected')
  }

  #extractCityFromAddress(address) {
    // Simple extraction - get the city name from address
    // Format is usually: "Street, City, Country"
    const parts = address.split(',')
    if (parts.length >= 2) {
      return parts[parts.length - 2].trim()
    }
    return null
  }

  #closeSuggestions() {
    if (this.suggestionsDropdown) {
      this.suggestionsDropdown.remove()
      this.suggestionsDropdown = null
    }
  }

  #clearInputValue() {
    if (this.hasAddressTarget) this.addressTarget.value = ""
    if (this.hasLatitudeTarget) this.latitudeTarget.value = ""
    if (this.hasLongitudeTarget) this.longitudeTarget.value = ""
    if (this.inputElement) this.inputElement.value = ""
    this.#closeSuggestions()
    this.#showHint("")
  }

  #showHint(message) {
    if (this.hasHintTarget) {
      this.hintTarget.innerHTML = message
    }
  }

  disconnect() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.#closeSuggestions()
  }
}
