import { Component } from '@angular/core';

@Component({
    selector: 'app-full-screen-map',
    templateUrl: './full-screen-map.component.html',
    styleUrls: ['./full-screen-map.component.scss'],
    standalone: false
})

export class FullScreenMapComponent {
    // Google map center and zoom for @angular/google-maps
    center: google.maps.LatLngLiteral = { lat: 51.678418, lng: 7.809007 };
    zoom = 12;
    
    // Marker position
    markerPosition: google.maps.LatLngLiteral = { lat: 51.678418, lng: 7.809007 };
    markerLabel = 'Location';
    markerTitle = 'Marker Title';
}