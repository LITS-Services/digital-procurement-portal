import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { FullPagesRoutingModule } from "./full-pages-routing.module";
import { ChartistModule } from "ng-chartist";
import { GoogleMapsModule } from "@angular/google-maps";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import { SwiperModule } from "ngx-swiper-wrapper";
import { PipeModule } from "app/shared/pipes/pipe.module";

import { GalleryPageComponent } from "./gallery/gallery-page.component";
import { InvoicePageComponent } from "./invoice/invoice-page.component";
import { HorizontalTimelinePageComponent } from "./timeline/horizontal/horizontal-timeline-page.component";
import { HorizontalTimelineComponent } from "./timeline/horizontal/component/horizontal-timeline.component";
import { TimelineVerticalCenterPageComponent } from "./timeline/vertical/timeline-vertical-center-page/timeline-vertical-center-page.component";
import { TimelineVerticalLeftPageComponent } from "./timeline/vertical/timeline-vertical-left-page/timeline-vertical-left-page.component";
import { TimelineVerticalRightPageComponent } from "./timeline/vertical/timeline-vertical-right-page/timeline-vertical-right-page.component";
import { UserProfilePageComponent } from "./user-profile/user-profile-page.component";
import { SearchComponent } from "./search/search.component";
import { FaqComponent } from "./faq/faq.component";
import { AccountSettingsComponent } from "./account-settings/account-settings.component";
import { UsersListComponent } from "./users/users-list/users-list.component";
import { UsersViewComponent } from "./users/users-view/users-view.component";
import { UsersEditComponent } from "./users/users-edit/users-edit.component";

import { NgxDatatableModule } from "@swimlane/ngx-datatable";
@NgModule({
  imports: [
    CommonModule,
    FullPagesRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    // ChartistModule, // Incompatible with Angular 21
    GoogleMapsModule,
    NgSelectModule,
    NgbModule,
    // SwiperModule, // Incompatible with Angular 21
    PipeModule,
    NgxDatatableModule,
  ],
  declarations: [
    GalleryPageComponent,
    InvoicePageComponent,
    HorizontalTimelinePageComponent,
    HorizontalTimelineComponent,
    TimelineVerticalCenterPageComponent,
    TimelineVerticalLeftPageComponent,
    TimelineVerticalRightPageComponent,
    UserProfilePageComponent,
    SearchComponent,
    FaqComponent,
    AccountSettingsComponent,
    UsersListComponent,
    UsersViewComponent,
    UsersEditComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class FullPagesModule {}
