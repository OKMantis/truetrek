import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="map"
export default class extends Controller {
  connect() {
       mapboxgl.accessToken = 'pk.eyJ1IjoiZXlvYWJoYWIiLCJhIjoiY21pb2dzdDF3MDIxZDNkczV5MzVoaDg1ZSJ9.VUE7WRQHlQA42YRm0v_2lw';
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        center: [-74.5, 40], // starting position [lng, lat]. Note that lat must be set between -90 and 90
        zoom: 9 // starting zoom
    });
  }
}
