import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';

import { FullLayoutComponent } from "./layouts/full/full-layout.component";
import { ContentLayoutComponent } from "./layouts/content/content-layout.component";

import { Full_ROUTES } from "./shared/routes/full-layout.routes";
import { CONTENT_ROUTES } from "./shared/routes/content-layout.routes";

import { AuthGuard } from './shared/auth/auth-guard.service';
import { VendorRegistrationFormComponent } from './vendor-registration-form/vendor-registration-form/vendor-registration-form.component';
import { NewPurchaseRequestComponent } from './purchase-request/new-purchase-request/new-purchase-request.component';
import { OtpComponent } from './pages/otp/otp.component';

const appRoutes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'pages/login',
  //   pathMatch: 'full',
  // },

    {
    path: '',
    redirectTo: 'dashboard/dashboard1',
    pathMatch: 'full',
  },
  {
    path: 'new-purchase-request/:id',
    component: NewPurchaseRequestComponent, // Your form component
    canActivate: [AuthGuard],
    data: { title: 'Update Purchase Request' }
  },
  {
    path: 'new-purchase-request',
    component: NewPurchaseRequestComponent, // For adding new
    canActivate: [AuthGuard],
    data: { title: 'New Purchase Request' }
  },
  {
    path: 'vendor-registration-form',
    component: VendorRegistrationFormComponent,
    data: {
      title: 'Vendor Registration Form',
      system: 'Vendor Registration Form'
    }
  },
  {
    path: 'otp',
    component: OtpComponent,
    data: { title: 'OTP Verification' }   // ✅ added
  },


  { path: '', component: FullLayoutComponent, data: { title: 'full Views' }, children: Full_ROUTES, canActivate: [AuthGuard] },
  { path: '', component: ContentLayoutComponent, data: { title: 'content Views' }, children: CONTENT_ROUTES },


  {
    path: '**',
    redirectTo: 'pages/error'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})

export class AppRoutingModule {
}
