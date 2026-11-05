import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

let isInitialized = false;

/**
 * Checks whether the current application context is configured for Arabic (RTL).
 */
export function isArabicMode(): boolean {
  try {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      if (
        html.getAttribute('data-lang') === 'ar' ||
        html.getAttribute('data-textdirection') === 'rtl' ||
        html.lang === 'ar' ||
        html.dir === 'rtl'
      ) {
        return true;
      }
      if (
        document.body &&
        (document.body.classList.contains('rtl') ||
          document.body.getAttribute('data-textdirection') === 'rtl')
      ) {
        return true;
      }
    }
    const stored =
      localStorage.getItem('dpp_language') || localStorage.getItem('language');
    return stored === 'ar';
  } catch {
    return false;
  }
}

/**
 * Maps English SweetAlert confirmation titles, texts, and buttons to natural, standard Arabic text.
 */
const SWAL_AR_DICTIONARY: Record<string, string> = {
  // Titles
  'Submit Bids?': 'تقديم العروض؟',
  'Submit Quotes?': 'تقديم العروض؟',
  'Submit Bid?': 'تقديم العرض؟',
  'Submit Quote?': 'تقديم العرض؟',
  'Are you sure?': 'هل أنت متأكد؟',
  'Confirm Invoice': 'تأكيد الفاتورة',
  'Confirm Shipment': 'تأكيد الشحنة',
  'Confirm Save': 'تأكيد الحفظ',
  'Confirm GRN Submission': 'تأكيد إرسال إشعار استلام البضائع',
  'Confirm Vendor Selection': 'تأكيد اختيار المورد',
  'Confirm Vendor Invitation': 'تأكيد دعوة الموردين',
  'Reject Purchase Order?': 'رفض أمر الشراء؟',
  'Reject Vendor?': 'رفض المورد؟',
  'Send for Revision?': 'إرسال للمراجعة؟',
  'Submit for Approval?': 'إرسال للموافقة؟',
  'Submitting…': 'جارٍ الإرسال…',
  'Submitting...': 'جارٍ الإرسال…',
  'Request Purchase Order?': 'طلب أمر شراء؟',
  'Create Purchase Order?': 'إنشاء أمر شراء؟',
  'Clear all notifications?': 'مسح جميع الإشعارات؟',
  'Mark all as read?': 'تحديد الكل كمقروء؟',
  'Save as Draft?': 'حفظ كمسودة؟',
  'Remove Exception Policy?': 'إزالة سياسة الاستثناء؟',
  'Delete Integration': 'حذف التكامل',
  'Trade license expiry date is in the past': 'تاريخ انتهاء الرخصة التجارية منتهي',
  'Submitted!': 'تم التقديم!',
  'Deleted!': 'تم الحذف!',
  'Failed!': 'فشل!',
  'Error': 'خطأ',
  'Error!': 'خطأ!',
  'Success': 'تم بنجاح',
  'Success!': 'تم بنجاح!',
  'Could not confirm response': 'تعذر تأكيد الاستجابة',
  'Warning': 'تحذير',
  'Warning!': 'تحذير!',
  'Budget Limit Warning': 'تحذير حد الميزانية',

  // Messages / Descriptions
  'Once submitted, you may not be able to modify the bids until revised.':
    'بمجرد التقديم، لن تتمكن من تعديل العروض حتى يتم طلب مراجعتها.',
  'Once submitted, you may not be able to modify the quotes until revised.':
    'بمجرد التقديم، لن تتمكن من تعديل العروض حتى يتم طلب مراجعتها.',
  'Have you carefully reviewed your bids before submitting?':
    'هل راجعت عروضك بعناية قبل التقديم؟',
  'Have you carefully reviewed your quotes before submitting?':
    'هل راجعت عروضك بعناية قبل التقديم؟',
  'Your bids have been submitted successfully.':
    'تم تقديم عروضك بنجاح.',
  'Your quotes have been submitted successfully.':
    'تم تقديم عروضك بنجاح.',
  'Failed to submit bids. Please try again.':
    'فشل تقديم العروض. يرجى المحاولة مرة أخرى.',
  'Failed to submit quotes. Please try again.':
    'فشل تقديم العروض. يرجى المحاولة مرة أخرى.',
  'Failed to submit bids. Please try again later.':
    'فشل تقديم العروض. يرجى المحاولة مرة أخرى لاحقاً.',
  'Failed to submit quotes. Please try again later.':
    'فشل تقديم العروض. يرجى المحاولة مرة أخرى لاحقاً.',
  'This action cannot be undone!':
    'لا يمكن التراجع عن هذا الإجراء!',
  'This action cannot be undone.':
    'لا يمكن التراجع عن هذا الإجراء.',
  'Do you want to send this invoice for payment?':
    'هل تريد إرسال هذه الفاتورة للدفع؟',
  'Are you sure you want to update this shipment?':
    'هل أنت متأكد من رغبتك في تحديث هذه الشحنة؟',
  'Are you sure you want to create this shipment?':
    'هل أنت متأكد من رغبتك في إنشاء هذه الشحنة؟',
  'This will delete the shipment and clear all line quantities!':
    'سيؤدي هذا إلى حذف الشحنة ومسح جميع كميات البنود!',
  'Shipment has been deleted.':
    'تم حذف الشحنة بنجاح.',
  'Failed to delete shipment.':
    'فشل حذف الشحنة.',
  'Are you sure you want to save these shipment lines?':
    'هل أنت متأكد من رغبتك في حفظ بنود الشحنة هذه؟',
  'Do you still want to attach this document?':
    'هل ما زلت ترغب في إرفاق هذا المستند؟',
  'This will delete all the notifications':
    'سيؤدي هذا إلى حذف جميع الإشعارات',
  'This will mark all notifications as read':
    'سيؤدي هذا إلى تحديد جميع الإشعارات كمقروءة',
  'Are you sure you want to submit this Purchase Request for approval?':
    'هل أنت متأكد من رغبتك في إرسال طلب الشراء هذا للموافقة؟',
  'Please wait while we submit your request.':
    'يرجى الانتظار بينما نقوم بإرسال طلبك.',
  'Selected record(s) have been deleted successfully.':
    'تم حذف السجل (السجلات) المحددة بنجاح.',
  'An error occurred while deleting records.':
    'حدث خطأ أثناء حذف السجلات.',
  'Failed to submit purchase request for approval.':
    'فشل في إرسال طلب الشراء للموافقة.',
  'This will send a request for PO for all items based on vendor assignment.':
    'سيؤدي هذا إلى إرسال طلب أمر شراء لجميع الأصناف بناءً على تعيين الموردين.',
  'This will generate PO(s) for all items based on your vendor selection.':
    'سيؤدي هذا إلى إنشاء أمر (أوامر) شراء لجميع الأصناف بناءً على اختيارك للموردين.',
  'This will generate PO(s) for all items based on vendor assignment.':
    'سيؤدي هذا إلى إنشاء أمر (أوامر) شراء لجميع الأصناف بناءً على تعيين الموردين.',
  'This will generate PO(s) automatically for all items based on vendor assignment.':
    'سيؤدي هذا إلى إنشاء أمر (أوامر) شراء تلقائياً لجميع الأصناف بناءً على تعيين الموردين.',
  'This will request for PO automatically for all items based on vendor assignment.':
    'سيؤدي هذا إلى طلب أمر شراء تلقائياً لجميع الأصناف بناءً على تعيين الموردين.',
  'If you uncheck, all exception policy information will be cleared and lost.':
    'إذا قمت بإلغاء التحديد، فسيتم مسح جميع معلومات سياسة الاستثناء وفقدانها.',
  'Do you want to save this request as a draft?':
    'هل تريد حفظ هذا الطلب كمسودة؟',
  'Do you want to delete this item?':
    'هل تريد حذف هذا الصنف؟',
  'Are you sure you want to submit this quotation for approval?':
    'هل أنت متأكد من رغبتك في إرسال طلب عرض الأسعار هذا للموافقة؟',
  'Are you sure you want to finalize the selected vendor(s)? This action cannot be undone.':
    'هل أنت متأكد من رغبتك في اعتماد المورد (الموردين) المحدد؟ لا يمكن التراجع عن هذا الإجراء.',
  'Failed to finalize vendors. Please try again.':
    'فشل اعتماد الموردين. يرجى المحاولة مرة أخرى.',
  "Are you sure you want to reject this vendor's bid?":
    'هل أنت متأكد من رغبتك في رفض عرض هذا المورد؟',
  "Are you sure you want to reject this vendor's quote?":
    'هل أنت متأكد من رغبتك في رفض عرض هذا المورد؟',
  "Are you sure you want to send this vendor's bid for revision?":
    'هل أنت متأكد من رغبتك في إرسال عرض هذا المورد للمراجعة؟',
  "Are you sure you want to send this vendor's quote for revision?":
    'هل أنت متأكد من رغبتك في إرسال عرض هذا المورد للمراجعة؟',
  'Selected vendors will be notified and invited to submit their quotations for this RFQ.':
    'سيتم إشعار الموردين المحددين ودعوتهم لتقديم عروض أسعارهم لهذا الطلب.',
  'Do you really want to delete this email template?':
    'هل تريد حقاً حذف قالب البريد الإلكتروني هذا؟',
  'Template has been deleted successfully.':
    'تم حذف القالب بنجاح.',
  'Failed to delete template.':
    'فشل حذف القالب.',
  'This record will be removed permanently.':
    'سيتم إزالة هذا السجل نهائياً.',
  'Integration deleted successfully.':
    'تم حذف التكامل بنجاح.',
  'Do you want to submit this company for approval?':
    'هل تريد إرسال هذه الشركة للموافقة؟',
  'Are you sure you want to submit this GRN?':
    'هل أنت متأكد من رغبتك في إرسال إشعار الاستلام هذا؟',

  // Buttons
  'Yes, submit': 'نعم، تقديم',
  'Yes, submit it': 'نعم، إرسال',
  'Yes, submit bids': 'نعم، تقديم العروض',
  'Yes, submit quotes': 'نعم، تقديم العروض',
  'Cancel': 'إلغاء',
  'No, cancel': 'لا، إلغاء',
  'No, go back': 'لا، تراجع',
  'Yes, delete': 'نعم، حذف',
  'Yes, delete it': 'نعم، حذف',
  'Yes, delete it!': 'نعم، حذف',
  'Yes, Reject': 'نعم، رفض',
  'Yes, send': 'نعم، إرسال',
  'Yes, continue': 'نعم، متابعة',
  'Yes, attach it': 'نعم، إرفاق',
  'Yes, Delete': 'نعم، حذف',
  'Yes, Mark all as read': 'نعم، تحديد الكل كمقروء',
  'Yes, Request PO': 'نعم، طلب أمر الشراء',
  'Yes, Create PO': 'نعم، إنشاء أمر الشراء',
  'Yes, remove it': 'نعم، إزالة',
  'Yes, save it': 'نعم، حفظ',
  'Yes, Submit': 'نعم، إرسال',
  'Yes, finalize': 'نعم، اعتماد',
  'Yes, Revise': 'نعم، مراجعة',
  'Send Invitations': 'إرسال الدعوات',
  'OK': 'حسناً',
  'Ok': 'حسناً',
  'OK, I understand': 'حسناً، فهمت',
  'Close': 'إغلاق',
};

const DYNAMIC_PATTERNS: Array<{
  regex: RegExp;
  replace: (match: RegExpMatchArray) => string;
}> = [
  {
    regex: /You are about to delete (\d+) record\(s\)\. This action cannot be undone\./i,
    replace: (m) => `أنت على وشك حذف ${m[1]} سجل (سجلات). لا يمكن التراجع عن هذا الإجراء.`
  },
  {
    regex: /You are about to delete (\d+) workflow\(s\)\. This action cannot be undone\./i,
    replace: (m) => `أنت على وشك حذف ${m[1]} مسار عمل. لا يمكن التراجع عن هذا الإجراء.`
  }
];

/**
 * Translates an English string to Arabic if a mapping exists.
 */
export function translateToAr(text: string): string {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (SWAL_AR_DICTIONARY[trimmed]) {
    return SWAL_AR_DICTIONARY[trimmed];
  }
  for (const item of DYNAMIC_PATTERNS) {
    const match = trimmed.match(item.regex);
    if (match) return item.replace(match);
  }
  return text;
}

/**
 * Normalizes English text replacing 'Bid' / 'Bids' with 'Quote' / 'Quotes'.
 */
export function replaceBidWithQuote(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\bSubmit Bids\b/g, 'Submit Quotes')
    .replace(/\bSubmit Bid\b/g, 'Submit Quote')
    .replace(/\bsubmit bids\b/g, 'submit quotes')
    .replace(/\bsubmit bid\b/g, 'submit quote')
    .replace(/\bBids Detail\b/g, 'Quotes Detail')
    .replace(/\bBid Price\b/g, 'Quote Price')
    .replace(/\bBid Amount\b/g, 'Quote Amount')
    .replace(/\bRecent Bids History\b/g, 'Recent Quotes History')
    .replace(/\bPlace Bid\b/g, 'Place Quote')
    .replace(/\bBidding Amount\b/g, 'Quote Amount')
    .replace(/\bAdd Bid\b/g, 'Add Quote')
    .replace(/\bUpdate Bid\b/g, 'Update Quote')
    .replace(/\bBids\b/g, 'Quotes')
    .replace(/\bBid\b/g, 'Quote')
    .replace(/\bbids\b/g, 'quotes')
    .replace(/\bbid\b/g, 'quote');
}

function localizeSweetAlertOptions(opts: SweetAlertOptions, isAr: boolean): void {
  if (isAr) {
    if (opts.title) opts.title = translateToAr(opts.title as string);
    if (opts.text) opts.text = translateToAr(opts.text as string);
    if (opts.confirmButtonText) opts.confirmButtonText = translateToAr(opts.confirmButtonText as string);
    if (opts.cancelButtonText) opts.cancelButtonText = translateToAr(opts.cancelButtonText as string);
    if (opts.denyButtonText) opts.denyButtonText = translateToAr(opts.denyButtonText as string);
    if (opts.footer && typeof opts.footer === 'string') opts.footer = translateToAr(opts.footer);

    const existingPopup =
      typeof opts.customClass === 'object' && opts.customClass?.popup
        ? opts.customClass.popup
        : '';
    const popupClass = (existingPopup ? existingPopup + ' ' : '') + 'swal2-rtl';
    opts.customClass = {
      ...(typeof opts.customClass === 'object' ? opts.customClass : {}),
      popup: popupClass,
      container: 'swal2-rtl-container',
    };
  } else {
    // English mode: Replace "Bid" / "Bids" with "Quote" / "Quotes"
    if (opts.title) opts.title = replaceBidWithQuote(opts.title as string);
    if (opts.text) opts.text = replaceBidWithQuote(opts.text as string);
    if (opts.confirmButtonText) opts.confirmButtonText = replaceBidWithQuote(opts.confirmButtonText as string);
    if (opts.cancelButtonText) opts.cancelButtonText = replaceBidWithQuote(opts.cancelButtonText as string);
    if (opts.denyButtonText) opts.denyButtonText = replaceBidWithQuote(opts.denyButtonText as string);
  }
}

/**
 * Globally instruments Swal.fire so that all confirmation modals shift to Arabic
 * when Arabic mode is selected, and normalizes Bid -> Quote in English mode.
 */
export function setupSweetAlertI18n(): void {
  if (isInitialized) return;
  isInitialized = true;

  const originalFire = Swal.fire.bind(Swal);

  (Swal as any).fire = function (...args: any[]): Promise<SweetAlertResult> {
    const isAr = isArabicMode();

    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      const opts = { ...args[0] };
      localizeSweetAlertOptions(opts, isAr);
      return originalFire(opts);
    } else if (args.length >= 1 && typeof args[0] === 'string') {
      const translatedArgs = [...args];
      if (isAr) {
        if (typeof translatedArgs[0] === 'string') translatedArgs[0] = translateToAr(translatedArgs[0]);
        if (typeof translatedArgs[1] === 'string') translatedArgs[1] = translateToAr(translatedArgs[1]);
      } else {
        if (typeof translatedArgs[0] === 'string') translatedArgs[0] = replaceBidWithQuote(translatedArgs[0]);
        if (typeof translatedArgs[1] === 'string') translatedArgs[1] = replaceBidWithQuote(translatedArgs[1]);
      }
      return originalFire(...translatedArgs);
    }
    return originalFire(...args);
  };
}

// Auto-instrument upon module load
setupSweetAlertI18n();

