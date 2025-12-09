import { Controller } from "@hotwired/stimulus"
import mapboxgl from 'mapbox-gl'

// Connects to data-controller="map"
export default class extends Controller {
  static values = {
    apiKey: String,
    markers: Array,
    pop: Boolean,
    center: Array, // Optional [lng, lat] for initial center
    zoom: { type: Number, default: 9 },
    geolocate: { type: Boolean, default: false }, // Request user's current location
  }
  connect() {
    mapboxgl.accessToken = this.apiKeyValue

    const mapOptions = {
      container: this.element,
      zoom: this.zoomValue,
      style: "mapbox://styles/mapbox/navigation-night-v1",
    }

    // If center is provided, use it as initial center
    if (this.hasCenterValue && this.centerValue.length === 2) {
      mapOptions.center = this.centerValue
    }

    this.map = new mapboxgl.Map(mapOptions);
    this.#addMarkersToMap()
    this.map.addControl(new mapboxgl.NavigationControl());

    // If geolocate is enabled, try to get user's current location
    if (this.geolocateValue) {
      this.#requestUserLocation()
    } else if (!this.hasCenterValue || this.centerValue.length !== 2) {
      // Fall back to fitting markers if no center and no geolocation
      this.#fitMapToMarkers()
    }
  }

  #requestUserLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success: center map on user's location
          this.map.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 10,
            duration: 1500
          })
        },
        (error) => {
          // Error or denied: fall back to fitting all markers
          console.log("Geolocation not available or denied:", error.message)
          this.#fitMapToMarkers()
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // Cache location for 5 minutes
        }
      )
    } else {
      // Browser doesn't support geolocation
      this.#fitMapToMarkers()
    }
  }
  #addMarkersToMap() {
    this.markersValue.forEach((marker) => {
      const popup = new mapboxgl.Popup().setHTML(marker.info_window_html)
      const mapboxMarker = new mapboxgl.Marker().setLngLat([marker.lng, marker.lat])
      if (this.popValue === true) {
        mapboxMarker.setPopup(popup) // Added this
      }
      mapboxMarker.addTo(this.map)
    })
  }

  #fitMapToMarkers() {
    const bounds = new mapboxgl.LngLatBounds()
    this.markersValue.forEach(marker => bounds.extend([marker.lng, marker.lat]))
    this.map.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 0 })
  }
}
