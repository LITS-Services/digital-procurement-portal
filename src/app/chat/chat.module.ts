import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { ChatRoutingModule } from "./chat-routing.module";
import { PipeModule } from 'app/shared/pipes/pipe.module';

import { ChatComponent } from "./chat.component";


@NgModule({
    imports: [
        CommonModule,
        ChatRoutingModule,
        NgbModule,
        FormsModule,
        // PerfectScrollbarModule, // Incompatible with Angular 21
        PipeModule
    ],
    declarations: [
        ChatComponent
    ],
    schemas: [NO_ERRORS_SCHEMA]
})
export class ChatModule { }
