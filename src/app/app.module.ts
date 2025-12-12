import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AngularFireModule } from "@angular/fire/compat";
import { AngularFireAuthModule } from "@angular/fire/compat/auth";
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { ToastrModule } from "ngx-toastr";
import { GoogleMapsModule } from "@angular/google-maps";
import { HttpClientModule } from "@angular/common/http";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader, TRANSLATE_HTTP_LOADER_CONFIG } from "@ngx-translate/http-loader";
import { StoreModule } from "@ngrx/store";
import { DragulaService, DragulaModule } from 'ng2-dragula';
import { NgxSpinnerModule } from 'ngx-spinner';

import {
  PerfectScrollbarModule,
  PERFECT_SCROLLBAR_CONFIG,
  
  PerfectScrollbarConfigInterface
} from 'ngx-perfect-scrollbar';

import { AppRoutingModule } from "./app-routing.module";
import { SharedModule } from "./shared/shared.module";
import * as fromApp from './store/app.reducer';
import { AppComponent } from "./app.component";
import { ContentLayoutComponent } from "./layouts/content/content-layout.component";
import { FullLayoutComponent } from "./layouts/full/full-layout.component";
import { AuthInterceptor } from './shared/auth/auth.interceptor';
import { AuthService } from "./shared/auth/auth.service";
import { AuthGuard } from "./shared/auth/auth-guard.service";
import { WINDOW_PROVIDERS } from './shared/services/window.service';
import { NewPurchaseRequestComponent } from './purchase-request/new-purchase-request/new-purchase-request.component';
import { BrowserModule } from "@angular/platform-browser";
import { ReactiveFormsModule } from "@angular/forms";
import { OtpComponent } from './pages/otp/otp.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { responseHandlerInterceptor } from "./shared/interceptor/response-handler.interceptor";
import { environment } from '../environments/environment';
import { AngularFireMessagingModule } from '@angular/fire/compat/messaging';
import { permissionInitializer } from "./shared/permissions/permission.init";
import { PermissionService } from "./shared/permissions/permission.service";

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true,
  wheelPropagation: false
};

@NgModule({
  declarations: [AppComponent, FullLayoutComponent, ContentLayoutComponent, OtpComponent ],
  imports: [
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right', // or 'toast-top-center' etc.
      timeOut: 444000,
    
      closeButton: true,
      progressBar: true
    }),
    BrowserAnimationsModule,
    StoreModule.forRoot(fromApp.appReducer),
    AppRoutingModule,
    SharedModule,
       BrowserModule,
    ReactiveFormsModule,
    HttpClientModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireMessagingModule,
    AngularFireAuthModule,
    ToastrModule.forRoot(),
    NgbModule,
    NgxDatatableModule,
    NgxSpinnerModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useClass: TranslateHttpLoader
      }
    }),
    GoogleMapsModule,
    // PerfectScrollbarModule, // Incompatible with Angular 21
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    {
      provide: TRANSLATE_HTTP_LOADER_CONFIG,
      useValue: { prefix: './assets/i18n/', suffix: '.json' }
    },
    AuthService,
    AuthGuard,
    DragulaService,
   { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: responseHandlerInterceptor, multi: true }, 
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    },
    {
      provide: APP_INITIALIZER,
      useFactory: permissionInitializer,
      deps: [PermissionService],
      multi: true
    },
    WINDOW_PROVIDERS
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
