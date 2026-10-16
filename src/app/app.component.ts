import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {

    subscription: Subscription;

    constructor(private router: Router) {
    }

    ngOnInit() {
        this.subscription = this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd)
            )
            .subscribe(() => window.scrollTo(0, 0));
    }


    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    @HostListener('wheel', ['$event'])
    onWindowWheel(event: WheelEvent) {
        const target = event.target as HTMLElement;
        const customTabs = target?.closest('.custom-tabs') as HTMLElement;
        if (customTabs && customTabs.scrollWidth > customTabs.clientWidth) {
            if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                customTabs.scrollLeft += event.deltaY;
            }
        }
    }

    @HostListener('click', ['$event'])
    onWindowClick(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const tabBtn = target?.closest('.custom-tabs .custom-style-tab') as HTMLElement;
        if (tabBtn) {
            tabBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }

}