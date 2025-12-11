import { Component } from '@angular/core';

@Component({
    selector: 'app-collapse',
    templateUrl: './collapse.component.html',
    styleUrls: ['./collapse.component.scss'],
    standalone: false
})

export class CollapseComponent {
    isCollapsed = false;
}