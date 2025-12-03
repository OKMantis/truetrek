import { Controller } from "@hotwired/stimulus"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"

// Connects to data-controller="address-autocomplete"
export default class extends Controller {
  static values = { apiKey: String }
  static targets = ["address", "latitude", "longitude"]

  connect() {
    this.geocoder = new MapboxGeocoder({
      accessToken: this.apiKeyValue,
      types: "country,region,place,postcode,locality,neighborhood,address",
      placeholder: "Start typing an address...",
      marker: false,
      flyTo: false
    })

    // Find or create container for geocoder
    const container = this.element.querySelector(".geocoder-container")
    if (container) {
      this.geocoder.addTo(container)
    } else {
      this.geocoder.addTo(this.element)
    }

    this.geocoder.on("result", event => this.#setInputValue(event))
    this.geocoder.on("clear", () => this.#clearInputValue())
  }

  #setInputValue(event) {
    const result = event.result
    this.addressTarget.value = result.place_name

    // Set coordinates if targets exist
    if (this.hasLatitudeTarget && this.hasLongitudeTarget && result.center) {
      this.longitudeTarget.value = result.center[0]
      this.latitudeTarget.value = result.center[1]
    }
  }

  #clearInputValue() {
    this.addressTarget.value = ""
    if (this.hasLatitudeTarget) this.latitudeTarget.value = ""
    if (this.hasLongitudeTarget) this.longitudeTarget.value = ""
  }

  disconnect() {
    this.geocoder.onRemove()
  }
}