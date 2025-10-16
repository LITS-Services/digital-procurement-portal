import { Component, Output, EventEmitter, OnDestroy, OnInit, AfterViewInit, ChangeDetectorRef, HostListener, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { ConfigService } from '../services/config.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { UntypedFormControl } from '@angular/forms';
import { LISTITEMS } from '../data/template-search';
import { Subscription } from 'rxjs';

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"]
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  currentLang = "en";
  selectedLanguageText = "English";
  selectedLanguageFlag = "./assets/img/flags/us.png";
  toggleClass = "ft-maximize";
  placement = "bottom-right";
  logoUrl = 'assets/img/logo.png';
  menuPosition = 'Side';
  isSmallScreen = false;
  protected innerWidth: any;
  searchOpenClass = "";
  transparentBGClass = "";
  hideSidebar: boolean = true;
  public isCollapsed = true;
  layoutSub: Subscription;
  configSub: Subscription;
  username: string;
  profilePicture: string = "assets/img/profile/user.png"; // default avatar

  @ViewChild('search') searchElement: ElementRef;
  @ViewChildren('searchResults') searchResults: QueryList<any>;

  @Output() toggleHideSidebar = new EventEmitter<Object>();
  @Output() seachTextEmpty = new EventEmitter<boolean>();

  listItems = [];
  control = new UntypedFormControl();
  public config: any = {};

  constructor(
    public translate: TranslateService,
    private layoutService: LayoutService,
    private router: Router,
    public authService: AuthService,
    private configService: ConfigService,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef
  ) {
    const browserLang: string = translate.getBrowserLang();
    translate.use(browserLang.match(/en|es|pt|de|ar/) ? browserLang : "en");
    this.config = this.configService.templateConf;
    this.innerWidth = window.innerWidth;

    this.layoutSub = layoutService.toggleSidebar$.subscribe(
      isShow => this.hideSidebar = !isShow
    );
  }

  ngOnInit() {
    this.listItems = LISTITEMS;
    this.isSmallScreen = this.innerWidth < 1200;

    // Fetch user data from API
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.companyService.getprocurementusersbyid(userId).subscribe({
        next: (res: any) => {
          if (res) {
            this.username = res.fullName || this.authService.getUserName();
            this.profilePicture = res.profilePicture || "assets/img/profile/user.png";
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.username = this.authService.getUserName();
          this.profilePicture = "assets/img/profile/user.png";
          this.cdr.detectChanges();
        }
      });
    } else {
      this.username = this.authService.getUserName();
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit() {
    this.configSub = this.configService.templateConf$.subscribe((templateConf) => {
      if (templateConf) this.config = templateConf;
      this.loadLayout();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    if (this.layoutSub) this.layoutSub.unsubscribe();
    if (this.configSub) this.configSub.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = event.target.innerWidth;
    this.isSmallScreen = this.innerWidth < 1200;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.authService.performLogout(),
      error: () => this.authService.performLogout()
    });
  }

  loadLayout() {
    if (this.config.layout.menuPosition) this.menuPosition = this.config.layout.menuPosition;
    this.logoUrl = (this.config.layout.variant === "Light") ? 'assets/img/logo-dark.png' : 'assets/img/logo.png';
    this.transparentBGClass = (this.config.layout.variant === "Transparent") ? this.config.layout.sidebar.backgroundColor : "";
  }

  onSearchKey(event: any) {
    if (this.searchResults && this.searchResults.length > 0) {
      this.searchResults.first.host.nativeElement.classList.add('first-active-item');
    }
    this.seachTextEmpty.emit(event.target.value === "");
  }

  removeActiveClass() {
    if (this.searchResults && this.searchResults.length > 0) {
      this.searchResults.first.host.nativeElement.classList.remove('first-active-item');
    }
  }

  onEscEvent() {
    this.control.setValue("");
    this.searchOpenClass = '';
    this.seachTextEmpty.emit(true);
  }

  onEnter() {
    if (this.searchResults && this.searchResults.length > 0) {
      let url = this.searchResults.first.url;
      if (url) {
        this.control.setValue("");
        this.searchOpenClass = '';
        this.router.navigate([url]);
        this.seachTextEmpty.emit(true);
      }
    }
  }

  redirectTo(value) {
    this.router.navigate([value]);
    this.seachTextEmpty.emit(true);
  }

  ChangeLanguage(language: string) {
    this.translate.use(language);
    switch (language) {
      case 'en': this.selectedLanguageText = "English"; this.selectedLanguageFlag = "./assets/img/flags/us.png"; break;
      case 'es': this.selectedLanguageText = "Spanish"; this.selectedLanguageFlag = "./assets/img/flags/es.png"; break;
      case 'pt': this.selectedLanguageText = "Portuguese"; this.selectedLanguageFlag = "./assets/img/flags/pt.png"; break;
      case 'de': this.selectedLanguageText = "German"; this.selectedLanguageFlag = "./assets/img/flags/de.png"; break;
      case 'ar': this.selectedLanguageText = "Arabic"; this.selectedLanguageFlag = "./assets/img/flags/de.png"; break;
    }
  }

  ToggleClass() {
    this.toggleClass = this.toggleClass === "ft-maximize" ? "ft-minimize" : "ft-maximize";
  }

  toggleSearchOpenClass(display) {
    this.control.setValue("");
    this.searchOpenClass = display ? 'open' : '';
    if (display) setTimeout(() => this.searchElement.nativeElement.focus(), 0);
    this.seachTextEmpty.emit(true);
  }

  toggleNotificationSidebar() {
    this.layoutService.toggleNotificationSidebar(true);
  }

  toggleSidebar() {
    this.layoutService.toggleSidebarSmallScreen(this.hideSidebar);
  }
}
