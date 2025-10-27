import { HttpClient } from "@angular/common/http";
import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { RfqService } from "app/rfq/rfq.service";
import { finalize } from "rxjs/operators";

enum CreatedByType {
  Procurement = 1,
  Vendor = 2,
}

@Component({
  selector: "app-selected-vendors-modal",
  templateUrl: "./selected-vendors-modal.component.html",
  styleUrls: ["./selected-vendors-modal.component.scss"],
})
export class SelectedVendorsModalComponent implements OnInit {
  @Input() viewMode = false;
  @Input() vendorId!: string;
  @Input() vendorName!: string;
  @Input() quotationId!: number;
  @Input() vendorCompanyId: string;
  dataComments: any[] = [];
  loading = false;
  CreatedByType = CreatedByType;
  form = this.fb.group({
    comment: ["", [Validators.required, Validators.maxLength(1000)]],
  });
  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    public rfqService: RfqService
  ) {}

  ngOnInit(): void {
    this.loadRfqComments();
  }

  closeDialog() {
    this.activeModal.close(false);
  }

  loadRfqComments() {
    this.loading = true;

    this.rfqService
      .getRFQComments(this.vendorId, this.quotationId, this.vendorCompanyId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res: any) => {
          const list: any[] = Array.isArray(res) ? res : [];
          this.dataComments = list.map((c: any) => ({
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
        },
        error: (err: any) => {
          console.error("Error loading RFQ comments", err);
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
          setTimeout(() => {
            this.loading = false;
          }, 1250);
        })
      )
      .subscribe({
        next: (saved: any) => {
          this.form.reset();
          this.loadRfqComments();
        },
        error: (err: any) => {
          console.error("Error posting RFQ comment", err);
        },
      });
  }
}
