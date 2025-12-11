import { Component } from '@angular/core';

@Component({
    selector: 'app-google-map',
    templateUrl: './google-map.component.html',
    styleUrls: ['./google-map.component.scss'],
    standalone: false
})

export class GoogleMapComponent {
  // Google map center and zoom for @angular/google-maps
  center: google.maps.LatLngLiteral = { lat: 51.678418, lng: 7.809007 };
  zoom = 12;
  
  // Marker position
  markerPosition: google.maps.LatLngLiteral = { lat: 51.678418, lng: 7.809007 };
  markerLabel = 'Location';
  markerTitle = 'Marker Title';
}