import { Controller } from "@hotwired/stimulus"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"

// Connects to data-controller="address-autocomplete"
export default class extends Controller {
  static values = { apiKey: String }
  static targets = ["address", "latitude", "longitude", "citySelect", "geocoderContainer", "addressHint"]

  connect() {
    this.geocoder = null
    this.selectedCity = null
  }

  cityChanged() {
    const select = this.citySelectTarget
    const selectedOption = select.options[select.selectedIndex]

    if (!selectedOption || !selectedOption.value) {
      this.#removeGeocoder()
      this.#showHint("Please select a city first")
      return
    }

    this.selectedCity = selectedOption.text
    this.#initializeGeocoder()
    this.#showHint(`Search for addresses in ${this.selectedCity}`)
  }

  #initializeGeocoder() {
    // Remove existing geocoder if any
    this.#removeGeocoder()

    this.geocoder = new MapboxGeocoder({
      accessToken: this.apiKeyValue,
      types: "address,poi",
      placeholder: `Search address in ${this.selectedCity}...`,
      marker: false,
      flyTo: false,
      // Bias results to the selected city
      proximity: null, // Will be set after geocoding the city
      filter: (item) => {
        // Filter results to only show those in or near the selected city
        return this.#isInSelectedCity(item)
      }
    })

    // First, geocode the city to get coordinates for proximity bias
    this.#geocodeCity()

    this.geocoderContainerTarget.innerHTML = ""
    this.geocoder.addTo(this.geocoderContainerTarget)

    this.geocoder.on("result", event => this.#setInputValue(event))
    this.geocoder.on("clear", () => this.#clearInputValue())
  }

  #geocodeCity() {
    // Use Mapbox to get city coordinates for proximity bias
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(this.selectedCity)}.json?access_token=${this.apiKeyValue}&types=place&limit=1`)
      .then(response => response.json())
      .then(data => {
        if (data.features && data.features.length > 0) {
          const cityCoords = data.features[0].center
          if (this.geocoder) {
            this.geocoder.setProximity({ longitude: cityCoords[0], latitude: cityCoords[1] })
          }
        }
      })
      .catch(error => console.error("Error geocoding city:", error))
  }

  #isInSelectedCity(item) {
    if (!this.selectedCity) return true

    const placeName = item.place_name.toLowerCase()
    const cityName = this.selectedCity.toLowerCase()

    // Check if the result contains the city name
    return placeName.includes(cityName)
  }

  #removeGeocoder() {
    if (this.geocoder) {
      this.geocoder.onRemove()
      this.geocoder = null
    }
    if (this.hasGeocoderContainerTarget) {
      this.geocoderContainerTarget.innerHTML = ""
    }
  }

  #showHint(message) {
    if (this.hasAddressHintTarget) {
      this.addressHintTarget.innerHTML = `<i class="fas fa-info-circle me-1"></i>${message}`
    }
  }

  #setInputValue(event) {
    const result = event.result
    this.addressTarget.value = result.place_name

    // Set coordinates if targets exist
    if (this.hasLatitudeTarget && this.hasLongitudeTarget && result.center) {
      this.longitudeTarget.value = result.center[0]
      this.latitudeTarget.value = result.center[1]
    }

    this.#showHint(`<i class="fas fa-check-circle text-success me-1"></i>Address selected in ${this.selectedCity}`)
  }

  #clearInputValue() {
    this.addressTarget.value = ""
    if (this.hasLatitudeTarget) this.latitudeTarget.value = ""
    if (this.hasLongitudeTarget) this.longitudeTarget.value = ""
    this.#showHint(`Search for addresses in ${this.selectedCity}`)
  }

  disconnect() {
    this.#removeGeocoder()
  }
}