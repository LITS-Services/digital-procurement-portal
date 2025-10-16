import {
  Component, OnInit, ViewChild, OnDestroy,
  ElementRef, AfterViewInit, ChangeDetectorRef, HostListener
} from "@angular/core";
import { ROUTES } from './vertical-menu-routes.config';
import { HROUTES } from '../horizontal-menu/navigation-routes.config';
import { Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { customAnimations } from "../animations/custom-animations";
import { DeviceDetectorService } from 'ngx-device-detector';
import { ConfigService } from '../services/config.service';
import { Subscription } from 'rxjs';
import { LayoutService } from '../services/layout.service';
import { AuthService } from 'app/shared/auth/auth.service';

@Component({
  selector: "app-sidebar",
  templateUrl: "./vertical-menu.component.html",
  animations: customAnimations
})
export class VerticalMenuComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('toggleIcon') toggleIcon: ElementRef;
  public menuItems: any[];
  level: number = 0;
  logoUrl: string = 'assets/img/logos/mini-logo.svg';
  expandedLogoUrl: string = 'assets/img/logos/Logo.svg';
  currentLogoUrl: string = this.logoUrl;
  public config: any = {};
  protected innerWidth: any;
  layoutSub: Subscription;
  configSub: Subscription;
  perfectScrollbarEnable = true;
  collapseSidebar = false;
  resizeTimeout;

  constructor(
    private router: Router,
    public translate: TranslateService,
    private layoutService: LayoutService,
    private configService: ConfigService,
    private cdr: ChangeDetectorRef,
    private deviceService: DeviceDetectorService,
    private authService: AuthService // ✅ Inject AuthService
  ) {
    this.config = this.configService.templateConf;
    this.innerWidth = window.innerWidth;
    this.isTouchDevice();
  }

  ngOnInit() {
    this.loadMenuItems();
  }

  ngAfterViewInit() {
    this.configSub = this.configService.templateConf$.subscribe((templateConf) => {
      if (templateConf) {
        this.config = templateConf;
      }
      this.loadLayout();
      this.cdr.markForCheck();
    });

    this.layoutSub = this.layoutService.overlaySidebarToggle$.subscribe(
      collapse => {
        if (this.config.layout.menuPosition === "Side") {
          this.collapseSidebar = collapse;
        }
      });
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event) {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      this.innerWidth = event.target.innerWidth;
      this.loadLayout();
    }, 500);
  }

  loadLayout() {
    if (this.config.layout.menuPosition === "Top") { // Horizontal Menu
      if (this.innerWidth < 1200) {
        this.menuItems = HROUTES;
      }
    } else if (this.config.layout.menuPosition === "Side") { // Vertical Menu
      this.loadMenuItems(); // ✅ Load role-based menu
    }

    if (this.config.layout.sidebar.backgroundColor === 'white') {
      this.logoUrl = 'assets/img/logos/mini-logo.svg';
      this.expandedLogoUrl = 'assets/img/img/logos/Logo.svg';
    } else {
      this.logoUrl = 'assets/img/logos/mini-logo.svg';
      this.expandedLogoUrl = 'assets/img/logos/Logo.svg';
    }

    this.updateLogo();

    this.collapseSidebar = !!this.config.layout.sidebar.collapsed;
  }

  updateLogo() {
    this.currentLogoUrl = this.config.layout.sidebar.collapsed ? this.logoUrl : this.expandedLogoUrl;
    this.collapseSidebar = this.config.layout.sidebar.collapsed;
  }

  toggleSidebar() {
    let conf = this.config;
    conf.layout.sidebar.collapsed = !this.config.layout.sidebar.collapsed;
    this.configService.applyTemplateConfigChange({ layout: conf.layout });

    setTimeout(() => {
      this.fireRefreshEventOnWindow();
    }, 300);
  }

  fireRefreshEventOnWindow() {
    const evt = document.createEvent("HTMLEvents");
    evt.initEvent("resize", true, false);
    window.dispatchEvent(evt);
  }

  CloseSidebar() {
    this.layoutService.toggleSidebarSmallScreen(false);
  }

  isTouchDevice() {
    const isMobile = this.deviceService.isMobile();
    const isTablet = this.deviceService.isTablet();
    this.perfectScrollbarEnable = !(isMobile || isTablet);
  }

  ngOnDestroy() {
    if (this.layoutSub) this.layoutSub.unsubscribe();
    if (this.configSub) this.configSub.unsubscribe();
  }

  // ===== Role-based Menu Filtering =====
  private loadMenuItems() {
    const userRoles = this.authService.getUserRoles(); // Get roles from localStorage
    this.menuItems = ROUTES.filter(menu => {
      if (menu.roles && menu.roles.length > 0) {
        // Show menu only if user has at least one matching role
        return menu.roles.some(role => userRoles.includes(role));
      }
      return true; // menu visible for all if no roles defined
    });
  }

}
