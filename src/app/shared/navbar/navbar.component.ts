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
import { LookupService } from '../services/lookup.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Swal from 'sweetalert2';

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

  companies: any[] = [];
  selectedCompanyId: string | number = '';
  // userId: string | null = null;

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

  selectedCompany?: { id: string | number; description: string };
  entityOpen = false;
  private destroy$ = new Subject<void>();

    isScrolled = false;
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
    private userService: UserServiceService,
    private lookupService: LookupService,
    private sanitizer: DomSanitizer  
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
      this.cdr.detectChanges();
    });
    this.bindSearch();

    this.getNotification();

    // this.userId = localStorage.getItem("userId");

    //Firebase Cloud Messaging Initialization
    const userId = localStorage.getItem("userId");

    this.messagingService.requestPermission(userId);
    if (userId) {
      // this.loadUserProfile(this.userId);
      this.loadProcUserCompanies(userId);
    }
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  //   private loadUserProfile(userId: string): void {
  //   this.companyService.getprocurementusersbyid(userId).subscribe({
  //     next: (res: any) => {
  //       if (res) {
  //         this.username = res.fullName || this.authService.getUserName();
  //         this.profilePicture = res.profilePicture || "assets/img/profile/user.png";
  //       } else {
  //         this.username = this.authService.getUserName();
  //         this.profilePicture = "assets/img/profile/user.png";
  //       }
  //       this.cdr.detectChanges();
  //     },
  //     error: () => {
  //       this.username = this.authService.getUserName();
  //       this.profilePicture = "assets/img/profile/user.png";
  //       this.cdr.detectChanges();
  //     },
  //   });
  // }

  private loadProcUserCompanies(userId: string): void {
    this.lookupService.getProcCompaniesByProcUserId(userId).subscribe({
      next: (res: any[]) => {
        this.companies = res || [];

      const allOption = { id: 'All', description: 'All Entities' };
      this.companies = [allOption, ...this.companies];

        if (this.companies.length > 0) {
          // Set first company as default
          const entityId = localStorage.getItem("selectedCompanyId");
          if (entityId && entityId !== 'All') {
            this.selectedCompanyId = Number(entityId);
          }
          else {
             this.selectedCompanyId = 'All';
             localStorage.setItem('selectedCompanyId', 'All');
          }
               this.syncSelectedCompany();
        }
        
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error fetching companies:', err)
    });
  }

  private syncSelectedCompany(): void {
  this.selectedCompany = this.companies?.find(c => c.id == this.selectedCompanyId);
}

  //   get selectedCompanyName(): string {
  //   const company = this.companies?.find(c => c.id == this.selectedCompanyId);
  //   return company ? company.description : 'Select Company';
  // }

onCompanyChange(eventOrId: any): void {
  const id = (eventOrId && eventOrId.target) ? eventOrId.target.value : eventOrId;

  if (id === 'All') {
    this.selectedCompanyId = 'All';
    localStorage.setItem('selectedCompanyId', 'All');
  } else {
    this.selectedCompanyId = +id;
    localStorage.setItem('selectedCompanyId', String(this.selectedCompanyId));
  }

  this.syncSelectedCompany();
  console.log('Active Company changed:', this.selectedCompanyId);
  window.location.reload();
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

private escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

highlightText(message: string | undefined | null, term: string | undefined | null): string {
  if (!message) return '';
  if (!term) return message;

  const safeTerm = this.escapeRegExp(term.trim());
  if (!safeTerm) return message;

  const regex = new RegExp(`(${safeTerm})`, 'gi');
  return message.replace(regex, '<span class="search-highlight">$1</span>');
}
  openPanel(): void {
    if ((this.searchCtrl.value || "").length) this.panelOpen = true;
  }

  getBadgeLabel(message: string | undefined | null): string {
  if (!message) {
    return '--';
  }
  const upper = message.toUpperCase();

  if (upper.includes('RFQ')) {
    return 'RFQ';
  }
  if (upper.includes(' PO')) {
    return 'PO';
  }
  if (upper.includes(' PR')) {
    return 'PR';
  }
  const words = message.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  const first = words[0]?.charAt(0) ?? '';
  const second = words[1]?.charAt(0) ?? '';
  const label = (first + second).toUpperCase();
  return label || '--';
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

  selectCompany(c: { id: string|number; description: string }, dd: any): void {
  this.selectedCompanyId = c.id;
  this.selectedCompany = c;
  this.onCompanyChange(c.id);
  dd.close();
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
    const target = ev.target as Node;

  // Notifications
  if (this.notifOpen) {
    const notifEl = this.notifRoot?.nativeElement;
    if (!notifEl || !notifEl.contains(target)) {
      this.closePanel(); 
    }
  }

  //  Search 
  if (this.panelOpen) {
    const sroot = this.searchRoot?.nativeElement;
    if (!sroot || !sroot.contains(target)) {
      this.closePanelsearch();   
      this.cdr.detectChanges(); 
    }
  }
  }




@HostListener('window:scroll', [])
onWindowScroll() {
  this.isScrolled = window.scrollY > 10;   // threshold
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

  redirection(referenceType: any, referenceId: any, title?:string) {

    
      const isCommentNotif =
    !!title && title.toLowerCase().includes('comment');

    switch (referenceType) {
      case ReferenceType.RFQ:
        this.router.navigate(["/rfq/new-rfq"], {
          queryParams: { id: referenceId,  focus: isCommentNotif ? 'comments' : undefined },
          skipLocationChange: true,
        });
        break;

      case ReferenceType.PR:
        this.router.navigate(["/purchase-request/new-purchase-request"], {
          queryParams: { id: referenceId },
          skipLocationChange: true,
        });
        break;

      case ReferenceType.PO:
        this.router.navigate(["/purchase-order/details"], {
          queryParams: { id: referenceId },
          skipLocationChange: true,
        });
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
        var a = this.redirection(n.referenceType, n.referenceId, n.title);
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

  clearAllNotification() {
       Swal.fire({
          title: 'Clear all notifications?',
          text: 'This will delete all the notifications',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Delete',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#dc3741',
        }).then((result) => {
          if (result.isConfirmed) {  
             this.notificationService.clearAllNotification().subscribe({
              next: () => {
                this.getNotification();
              },
              error: () => {
                this.toaster.error('Something went wrong while creating PO.');
              }
            });
          }
        });
  }


  markAllAsRead() {
      Swal.fire({
          title: 'Mark all as read?',
          text: 'This will mark all notifications as read',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Mark all as read',
          cancelButtonText: 'Cancel',
        }).then((result) => {
          if (result.isConfirmed) {
             this.notificationService.markAllAsRead().subscribe({
              next: () => {
                this.getNotification();
              },
              error: () => {
                this.toaster.error('Something went wrong while creating PO.');
              }
            });
          }
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