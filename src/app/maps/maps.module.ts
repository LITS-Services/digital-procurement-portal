import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";

import { GoogleMapsModule } from '@angular/google-maps';
import { MapsRoutingModule } from "./maps-routing.module";

import { FullScreenMapComponent } from "./full-screen-map/full-screen-map.component";
import { GoogleMapComponent } from "./google-map/google-map.component";

@NgModule({
    imports: [
        CommonModule,
        MapsRoutingModule,
        GoogleMapsModule
    ],
    declarations: [
        FullScreenMapComponent,
        GoogleMapComponent
    ]
})
export class MapsModule { }
