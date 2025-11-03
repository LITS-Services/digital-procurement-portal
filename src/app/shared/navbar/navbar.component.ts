import { Component, Output, EventEmitter, OnDestroy, OnInit, AfterViewInit, ChangeDetectorRef, HostListener, ViewChild, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LayoutService } from '../services/layout.service';
import { ConfigService } from '../services/config.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { FormControl, UntypedFormControl } from '@angular/forms';
import { LISTITEMS } from '../data/template-search';
import { fromEvent, of, Subject, Subscription } from 'rxjs';
import { NotifcationService, ReferenceType } from '../services/notification.service';
import { FirebaseMessagingService } from 'app/firebase-messaging.service';
import { ToastrService } from 'ngx-toastr';
import { tr } from 'date-fns/locale';
import { catchError, debounceTime, distinctUntilChanged, filter, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { UserServiceService } from '../services/user-service.service';

@Component({
  selector: "app-navbar",
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  currentLang = "en";
  selectedLanguageText = "English";
  selectedLanguageFlag = "./assets/img/flags/us.png";
  toggleClass = "ft-maximize";
  placement = "bottom-right";
  logoUrl = "assets/img/logo.png";
  menuPosition = "Side";
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
  private sub!: Subscription;

  @ViewChild("search") searchElement: ElementRef;
  @ViewChildren("searchResults") searchResults: QueryList<any>;

  @ViewChild("searchRoot", { static: true }) searchRoot!: ElementRef;

  @Output() toggleHideSidebar = new EventEmitter<Object>();
  @Output() seachTextEmpty = new EventEmitter<boolean>();

  searchCtrl = new FormControl("");
  listItems = [];
  control = new UntypedFormControl();
  public config: any = {};

  @ViewChild("notifRoot", { static: false })
  notifRoot!: ElementRef<HTMLElement>;

  notifOpen = false;

  notifications: any[] = [];
  unreadCount: number = null;
  notificationCount: number = null;

  results: any[] = [];
  panelOpen = false;
  loading = false;
  activeIndex = -1;

  private destroy$ = new Subject<void>();
  constructor(
    public translate: TranslateService,
    private layoutService: LayoutService,
    private router: Router,
    public authService: AuthService,
    private configService: ConfigService,
    private companyService: CompanyService,
    private notificationService: NotifcationService,
    private cdr: ChangeDetectorRef,
    private messagingService: FirebaseMessagingService,
    private toaster: ToastrService,
    private userService: UserServiceService
  ) {
    const browserLang: string = translate.getBrowserLang();
    translate.use(browserLang.match(/en|es|pt|de|ar/) ? browserLang : "en");
    this.config = this.configService.templateConf;
    this.innerWidth = window.innerWidth;

    this.layoutSub = layoutService.toggleSidebar$.subscribe(
      (isShow) => (this.hideSidebar = !isShow)
    );
  }

  ngOnInit() {
    this.sub = this.userService.profilePicture$.subscribe(url => {
      this.profilePicture = url || 'assets/img/profile/user.png';
    });
    this.bindSearch();
    this.setupClickOutside();
    this.getNotification();

    //Firebase Cloud Messaging Initialization
    const userId = localStorage.getItem("userId");
    this.messagingService.requestPermission(userId);

    this.messagingService.currentMessage.subscribe((msg) => {
      if (msg) {
        this.toaster.success(
          msg.notification?.title || "New Notification",
          msg.notification?.body || ""
        );
        this.getNotification();
        // You can show a toast or alert here
      }
    });
    this.listItems = LISTITEMS;
    this.isSmallScreen = this.innerWidth < 1200;

    // Fetch user data from AP
    if (userId) {
      this.companyService.getprocurementusersbyid(userId).subscribe({
        next: (res: any) => {
          if (res) {
            this.username = res.fullName || this.authService.getUserName();
            this.profilePicture =
              res.profilePicture || "assets/img/profile/user.png";
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.username = this.authService.getUserName();
          this.profilePicture = "assets/img/profile/user.png";
          this.cdr.detectChanges();
        },
      });
    } else {
      this.username = this.authService.getUserName();
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit() {
    this.configSub = this.configService.templateConf$.subscribe(
      (templateConf) => {
        if (templateConf) this.config = templateConf;
        this.loadLayout();
        this.cdr.markForCheck();
      }
    );
  }

  ngOnDestroy() {
    if (this.layoutSub) this.layoutSub.unsubscribe();
    if (this.configSub) this.configSub.unsubscribe();
  }

  bindSearch(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((q) => {
          this.panelOpen = !!q;
          this.loading = !!q;
          this.activeIndex = -1;
          this.cdr.markForCheck();
        }),
        switchMap((q) =>
          q
            ? this.notificationService.getSearch(q).pipe(
              catchError(() => of([])),
              finalize(() => {
                this.loading = false;
                this.cdr.markForCheck();
              })
            )
            : of([])
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.results = res || [];
        this.cdr.markForCheck();
      });
  }

  setupClickOutside(): void {
    fromEvent<MouseEvent>(document, "click")
      .pipe(
        filter(
          (ev) =>
            this.searchRoot &&
            !this.searchRoot.nativeElement.contains(ev.target as Node)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.closePanel());
  }

  openPanel(): void {
    if ((this.searchCtrl.value || "").length) this.panelOpen = true;
  }

  closePanelsearch(): void {
    this.panelOpen = false;
    this.activeIndex = -1;
  }

  onKeyDown(ev: KeyboardEvent): void {
    if (!this.panelOpen) return;
    const max = this.results.length - 1;

    switch (ev.key) {
      case "ArrowDown":
        ev.preventDefault();
        this.activeIndex = this.activeIndex < max ? this.activeIndex + 1 : 0;
        break;
      case "ArrowUp":
        ev.preventDefault();
        this.activeIndex = this.activeIndex > 0 ? this.activeIndex - 1 : max;
        break;
      case "Enter":
        if (this.activeIndex > -1 && this.results[this.activeIndex]) {
          this.selectResult(this.results[this.activeIndex]);
          ev.preventDefault();
        }
        break;
      case "Escape":
        this.closePanelsearch();
        break;
    }
  }

  selectResult(item: any): void {
    this.redirection(item.referenceType, item.referenceId);
    this.closePanelsearch();
    // TODO: adapt navigation based on your data
    // Example:
    // this.router.navigate(['/rfq/new-rfq'], { queryParams: { id: item.id }, skipLocationChange: true });
    // Or emit an event, or open a detail, etc.
    console.log("Selected search item:", item);
  }

  trackById(_: number, item: any) {
    return item?.id ?? item?.Id ?? item?.code ?? item?.DocumentNo ?? item;
  }

  //   get getNotificationCount(): number {
  //   return this.notifications.length
  // }

  togglePanel(): void {
    this.notifOpen = !this.notifOpen;
  }

  closePanel(): void {
    this.notifOpen = false;
  }

  @HostListener("document:click", ["$event"])
  onDocClick(ev: MouseEvent): void {
    if (!this.notifOpen) return;
    const root = this.notifRoot?.nativeElement;
    if (root && !root.contains(ev.target as Node)) {
      this.closePanel();
    }
  }

  getNotification() {
    this.notificationService.getNotification().subscribe((res: any) => {
      this.notifications = res.messages.map((m: any, index: number) => ({
        id: m.id,
        title: m.title,
        message: m.message,
        timeAgo: this.timeSince(new Date(m.createdOn)),
        read: false,
        status: m.status,
        createdOn: m.createdOn,
        referenceType: m.referenceType as ReferenceType,
        referenceId: m.referenceId,
      }));
      this.notificationCount = res.messages?.length;
      this.unreadCount = res.unreadCount;
      this.cdr.detectChanges();
    });
  }

  redirection(referenceType: any, referenceId: any) {
    switch (referenceType) {
      case ReferenceType.RFQ:
        this.router.navigate(["/rfq/new-rfq"], {
          queryParams: { id: referenceId, mode: "view" },
          skipLocationChange: true,
        });
        break;

      case ReferenceType.PR:
        this.router.navigate(["/purchase-request/new-purchase-request"], {
          queryParams: { id: referenceId, mode: "view" },
          skipLocationChange: true,
        });
        break;

      case ReferenceType.PO:

      // this.selectedPO = { id: n.referenceId };
      // this.modalService.open(this.purchaseOrderDetail, { size: 'lg', centered: true });
      // break;

      case ReferenceType.Default:
        return ReferenceType.Default;

      default:
        console.warn("Unhandled reference type:", referenceType);
        break;
    }
  }

  onSearch() { }

  onNotifClick(n: any): void {
    const wasUnread = n.status === 0;
    n.status = 1;
    if (wasUnread && this.unreadCount > 0) this.unreadCount--;

    this.notificationService.markAsRead(n.id).subscribe({
      next: () => {
        var a = this.redirection(n.referenceType, n.referenceId);
        if (a == ReferenceType.Default) {
          this.notifications.filter((m: any) => m.id === n.id)[0].status = 1;
        }

        this.closePanel();
      },
      error: () => {
        if (wasUnread) {
          n.status = 0;
          this.unreadCount++;
        }
      },
    });
  }

  @HostListener("window:resize", ["$event"])
  onResize(event) {
    this.innerWidth = event.target.innerWidth;
    this.isSmallScreen = this.innerWidth < 1200;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.authService.performLogout(),
      error: () => this.authService.performLogout(),
    });
  }

  loadLayout() {
    if (this.config.layout.menuPosition)
      this.menuPosition = this.config.layout.menuPosition;
    this.logoUrl =
      this.config.layout.variant === "Light"
        ? "assets/img/logo-dark.png"
        : "assets/img/logo.png";
    this.transparentBGClass =
      this.config.layout.variant === "Transparent"
        ? this.config.layout.sidebar.backgroundColor
        : "";
  }

  onSearchKey(event: any) {
    if (this.searchResults && this.searchResults.length > 0) {
      this.searchResults.first.host.nativeElement.classList.add(
        "first-active-item"
      );
    }
    this.seachTextEmpty.emit(event.target.value === "");
  }

  removeActiveClass() {
    if (this.searchResults && this.searchResults.length > 0) {
      this.searchResults.first.host.nativeElement.classList.remove(
        "first-active-item"
      );
    }
  }

  onEscEvent() {
    this.control.setValue("");
    this.searchOpenClass = "";
    this.seachTextEmpty.emit(true);
  }

  onEnter() {
    if (this.searchResults && this.searchResults.length > 0) {
      let url = this.searchResults.first.url;
      if (url) {
        this.control.setValue("");
        this.searchOpenClass = "";
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
      case "en":
        this.selectedLanguageText = "English";
        this.selectedLanguageFlag = "./assets/img/flags/us.png";
        break;
      case "es":
        this.selectedLanguageText = "Spanish";
        this.selectedLanguageFlag = "./assets/img/flags/es.png";
        break;
      case "pt":
        this.selectedLanguageText = "Portuguese";
        this.selectedLanguageFlag = "./assets/img/flags/pt.png";
        break;
      case "de":
        this.selectedLanguageText = "German";
        this.selectedLanguageFlag = "./assets/img/flags/de.png";
        break;
      case "ar":
        this.selectedLanguageText = "Arabic";
        this.selectedLanguageFlag = "./assets/img/flags/de.png";
        break;
    }
  }

  ToggleClass() {
    this.toggleClass =
      this.toggleClass === "ft-maximize" ? "ft-minimize" : "ft-maximize";
  }

  toggleSearchOpenClass(display) {
    this.control.setValue("");
    this.searchOpenClass = display ? "open" : "";
    if (display) setTimeout(() => this.searchElement.nativeElement.focus(), 0);
    this.seachTextEmpty.emit(true);
  }

  toggleNotificationSidebar() {
    this.layoutService.toggleNotificationSidebar(true);
  }

  toggleSidebar() {
    this.layoutService.toggleSidebarSmallScreen(this.hideSidebar);
  }

  timeSince(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 30) return "just now";

    const units = [
      { label: "y", secs: 31536000 },
      { label: "mo", secs: 2592000 },
      { label: "w", secs: 604800 },
      { label: "d", secs: 86400 },
      { label: "h", secs: 3600 },
      { label: "m", secs: 60 },
    ];

    for (const u of units) {
      const v = Math.floor(seconds / u.secs);
      if (v >= 1) return `${v}${u.label} ago`;
    }
    // Fallback: seconds level shows as "1m ago" minimum; we handled <30s above
    return "1m ago";
  }
}

