import { HttpClient } from "@angular/common/http";
import { ChangeDetectorRef, Component, Input, OnInit, SimpleChanges } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { RfqService } from "app/rfq/rfq.service";
import { SignalRService } from "app/shared/services/signalr.service";
import { finalize } from "rxjs/operators";

enum CreatedByType {
  Procurement = 1,
  Vendor = 2,
}

@Component({
  selector: "app-selected-vendors-modal",
  templateUrl: "./selected-vendors-modal.component.html",
  standalone: false,
  styleUrls: ["./selected-vendors-modal.component.scss"],
})
export class SelectedVendorsModalComponent implements OnInit {
  @Input() viewMode = false;
  @Input() vendorId!: string;
  @Input() vendorName!: string;
  @Input() quotationId!: number;
  @Input() vendorCompanyId: string;
  @Input() isChatBox: boolean = false
  dataComments: any[] = [];
  loading = false;
  CreatedByType = CreatedByType;
  form = this.fb.group({
    comment: ["", [Validators.required, Validators.maxLength(1000)]],
  });

  joinedVendorGroups = new Set<string>();
  isTyping = false;
  typingTimeout: any;

  currentUserType: CreatedByType = CreatedByType.Procurement;
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    public rfqService: RfqService,
    public cdr: ChangeDetectorRef,
    private signalRService: SignalRService
  ) { }

  ngOnInit(): void {
    this.signalRService.setChatActive(true);
    this.loadRfqComments();

    this.signalRService.startConnection()
      .then(() => {
        console.log("SignalR connected");

        this.joinVendorGroup(this.vendorId);

        const currentUserType = this.CreatedByType.Procurement; 
        this.signalRService.hubConnection.invoke(
          'MarkCommentAsRead',
          this.quotationId,
          this.vendorId,
          currentUserType
        ).catch(err => console.error('Failed to mark comments as read', err));

      })
      .catch(err => console.error("SignalR connection error", err));
    this.signalRService.comment$.subscribe(comment => {
      if (!comment) return;

      if (
        comment.quotationId === this.quotationId &&
        comment.vendorId === this.vendorId
      ) {
        this.dataComments.push({
          commentId: comment.commentId,
          vendor: this.vendorName,
          comments: comment.commentText ?? comment.message,
          createdByType: comment.createdByType ?? 0,
          createdByLabel:
            (comment.createdByType ?? 0) === CreatedByType.Procurement
              ? "Procurement"
              : "Vendor",
          createdOn: comment.createdAt,
          createdBy: comment.createdBy,
          seenByType: 0
        });

        if (this.signalRService.isChatActive && comment.commentId) {
          const currentUserType = this.CreatedByType.Procurement;
          this.signalRService.markCommentAsRead(comment.quotationId, comment.vendorId, currentUserType);
        }

        this.cdr.detectChanges();
        this.scrollToBottom();
      }
    });

    this.signalRService.typing$.subscribe(data => {
      if (!data) return;

      if (
        data.quotationId === this.quotationId &&
        data.vendorId === this.vendorId && data.createdByType !== CreatedByType.Procurement
      ) {
        this.isTyping = data.isTyping;
        this.cdr.detectChanges();
      }
    });

    this.signalRService.commentSeen$.subscribe(seen => {
      if (!seen) return;

      this.dataComments
        .filter(c => c.createdByType === this.currentUserType)
        .forEach(c => {
          c.seenByType = 0; 
        });

      const lastOwnMessage = [...this.dataComments]
        .reverse()
        .find(c => c.createdByType === this.currentUserType);

      if (lastOwnMessage?.commentId === seen.commentId) {
        lastOwnMessage.seenByType = seen.seenByType;
        this.cdr.detectChanges();
      }
    });


  }
  onTyping() {
    // Notify typing start
    this.signalRService.sendTyping(
      this.quotationId,
      this.vendorId,
      true,
      CreatedByType.Procurement
    );

    clearTimeout(this.typingTimeout);

    // Stop typing after inactivity
    this.typingTimeout = setTimeout(() => {
      this.signalRService.sendTyping(
        this.quotationId,
        this.vendorId,
        false,
        CreatedByType.Procurement
      );
    }, 3000);
  }

  async joinVendorGroup(vendorId: string) {
    if (!vendorId || this.joinedVendorGroups.has(vendorId)) return;

    try {
      await this.signalRService.joinQuotation(this.quotationId, vendorId);
      this.joinedVendorGroups.add(vendorId);
      console.log("Joined quotation group:", this.quotationId, vendorId);
    } catch (err) {
      console.error("Error joining vendor group:", err);
    }
  }

  ngOnDestroy(): void {
    this.signalRService.setChatActive(false);
    this.signalRService.leaveQuotation(this.quotationId, this.vendorId);
    this.signalRService.stopConnection();
  }

  // ngOnChanges(changes: SimpleChanges) {
  // if (changes['vendorId'] || changes['vendorCompanyId'] || changes['quotationId']) {
  //   this.loadRfqComments();
  // }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['vendorId'] && !changes['vendorId'].firstChange) {
      this.joinVendorGroup(this.vendorId);
      this.loadRfqComments();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = document.getElementById('threadScroll');
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  loadRfqComments() {
    this.loading = true;

    this.rfqService
      .getRFQComments(this.vendorId, this.quotationId, this.vendorCompanyId)
      .pipe(finalize(() => {
        this.loading = false
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          const list: any[] = Array.isArray(res) ? res : [];
          this.dataComments = list.reverse().map((c: any) => ({
            vendor: this.vendorName,
            comments: c?.commentText ?? "",
            createdByType: c?.createdByType as number,
            createdByLabel:
              (c?.createdByType as number) === CreatedByType.Procurement
                ? "Procurement"
                : "Vendor",
            createdOn: c?.createdOn,
            createdBy: c?.createdBy,
          }));
          this.cdr.detectChanges();
          this.scrollToBottom();
        },
        error: (err: any) => {
          console.error("Error loading RFQ comments", err);
          this.dataComments = [];
          this.cdr.detectChanges();
        },
      });
  }

  insert() {
    if (this.form.invalid || this.viewMode) return;

    this.loading = true;
    const commentText = this.form.value.comment?.trim();
    if (!commentText) return;

    const payload: any = {
      quotationId: this.quotationId,
      vendorId: this.vendorId,
      vendorCompanyId: this.vendorCompanyId,
      commentText,
      createdByType: CreatedByType.Procurement,
    };

    this.rfqService
      .addRfqComment(payload)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (saved: any) => {
          this.form.reset();
          //this.loadRfqComments();
          this.signalRService.sendTyping(
            this.quotationId,
            this.vendorId,
            false,
            CreatedByType.Procurement
          );
        },
        error: (err: any) => {
          console.error("Error posting RFQ comment", err);
        },
      });
  }

  onEnterPress(event: KeyboardEvent) {
    if (event.shiftKey) {
      // Shift + Enter → allow new line
      return;
    }
    // Enter only → send message
    event.preventDefault();

    if (this.form.invalid) return;
    this.insert();
  }
}