/**
 * Country localization utility for international phone inputs (ngx-intl-tel-input).
 * Ensures that countries display only English text when English is active,
 * and only Arabic text when Arabic is active.
 */

const ARABIC_COUNTRIES_BY_ISO: Record<string, string> = {
  af: 'أفغانستان',
  al: 'ألبانيا',
  dz: 'الجزائر',
  as: 'ساموا الأمريكية',
  ad: 'أندورا',
  ao: 'أنغولا',
  ai: 'أنغويلا',
  ag: 'أنتيغوا وبربودا',
  ar: 'الأرجنتين',
  am: 'أرمينيا',
  aw: 'أروبا',
  au: 'أستراليا',
  at: 'النمسا',
  az: 'أذربيجان',
  bs: 'الباهاماس',
  bh: 'البحرين',
  bd: 'بنغلاديش',
  bb: 'باربادوس',
  by: 'بيلاروسيا',
  be: 'بلجيكا',
  bz: 'بليز',
  bj: 'بنين',
  bm: 'برمودا',
  bt: 'بوتان',
  bo: 'بوليفيا',
  ba: 'البوسنة والهرسك',
  bw: 'بوتسوانا',
  br: 'البرازيل',
  io: 'إقليم المحيط الهندي البريطاني',
  vg: 'جزر العذراء البريطانية',
  bn: 'بروناي',
  bg: 'بلغاريا',
  bf: 'بوركينا فاسو',
  bi: 'بوروندي',
  kh: 'كمبوديا',
  cm: 'الكاميرون',
  ca: 'كندا',
  cv: 'الرأس الأخضر',
  ky: 'جزر كايمان',
  cf: 'جمهورية أفريقيا الوسطى',
  td: 'تشاد',
  cl: 'تشيلي',
  cn: 'الصين',
  cx: 'جزيرة عيد الميلاد',
  cc: 'جزر كوكوس',
  co: 'كولومبيا',
  km: 'جزر القمر',
  cd: 'جمهورية الكونغو الديمقراطية',
  cg: 'جمهورية الكونغو',
  ck: 'جزر كوك',
  cr: 'كوستاريكا',
  ci: 'ساحل العاج',
  hr: 'كرواتيا',
  cu: 'كوبا',
  cy: 'قبرص',
  cz: 'التشيك',
  dk: 'الدنمارك',
  dj: 'جيبوتي',
  dm: 'دومينيكا',
  do: 'جمهورية الدومينيكان',
  ec: 'الإكوادور',
  eg: 'مصر',
  sv: 'السلفادور',
  gq: 'غينيا الاستوائية',
  er: 'إريتريا',
  ee: 'إستونيا',
  et: 'إثيوبيا',
  fk: 'جزر فوكلاند',
  fo: 'جزر فارو',
  fj: 'فيجي',
  fi: 'فنلندا',
  fr: 'فرنسا',
  gf: 'غويانا الفرنسية',
  pf: 'بولينيزيا الفرنسية',
  ga: 'الغابون',
  gm: 'غامبيا',
  ge: 'جورجيا',
  de: 'ألمانيا',
  gh: 'غانا',
  gi: 'جبل طارق',
  gr: 'اليونان',
  gl: 'جرينلاند',
  gd: 'غرينادا',
  gp: 'غوادلوب',
  gu: 'غوام',
  gt: 'غواتيمالا',
  gg: 'غيرنزي',
  gn: 'غينيا',
  gw: 'غينيا بيساو',
  gy: 'غيانا',
  ht: 'هايتي',
  hn: 'هندوراس',
  hk: 'هونغ كونغ',
  hu: 'المجر',
  is: 'آيسلندا',
  in: 'الهند',
  id: 'إندونيسيا',
  ir: 'إيران',
  iq: 'العراق',
  ie: 'أيرلندا',
  im: 'جزيرة مان',
  il: 'إسرائيل',
  it: 'إيطاليا',
  jm: 'جامايكا',
  jp: 'اليابان',
  je: 'جيرزي',
  jo: 'الأردن',
  kz: 'كازاخستان',
  ke: 'كينيا',
  ki: 'كيريباتي',
  kw: 'الكويت',
  kg: 'قيرغيزستان',
  la: 'لاوس',
  lv: 'لاتفيا',
  lb: 'لبنان',
  ls: 'ليسوتو',
  lr: 'ليبيريا',
  ly: 'ليبيا',
  li: 'ليختنشتاين',
  lt: 'ليتوانيا',
  lu: 'لوكسمبورغ',
  mo: 'ماكاو',
  mk: 'مقدونيا الشمالية',
  mg: 'مدغشقر',
  mw: 'ملاوي',
  my: 'ماليزيا',
  mv: 'المالديف',
  ml: 'مالي',
  mt: 'مالطا',
  mh: 'جزر مارشال',
  mq: 'مارتينيك',
  mr: 'موريتانيا',
  mu: 'موريشيوس',
  yt: 'مايوت',
  mx: 'المكسيك',
  fm: 'ميكرونيزيا',
  md: 'مولدوفا',
  mc: 'موناكو',
  mn: 'منغوليا',
  me: 'الجبل الأسود',
  ms: 'مونتسرات',
  ma: 'المغرب',
  mz: 'موزمبيق',
  mm: 'ميانمار',
  na: 'ناميبيا',
  nr: 'ناورو',
  np: 'نيبال',
  nl: 'هولندا',
  nc: 'كاليدونيا الجديدة',
  nz: 'نيوزيلندا',
  ni: 'نيكاراغوا',
  ne: 'النيجر',
  ng: 'نيجيريا',
  nu: 'نيوي',
  nf: 'جزيرة نورفولك',
  kp: 'كوريا الشمالية',
  mp: 'جزر ماريانا الشمالية',
  no: 'النرويج',
  om: 'عُمان',
  pk: 'باكستان',
  pw: 'بالاو',
  ps: 'فلسطين',
  pa: 'بنما',
  pg: 'بابوا غينيا الجديدة',
  py: 'باراغواي',
  pe: 'بيرو',
  ph: 'الفلبين',
  pl: 'بولندا',
  pt: 'البرتغال',
  pr: 'بورتوريكو',
  qa: 'قطر',
  re: 'ريونيون',
  ro: 'رومانيا',
  ru: 'روسيا',
  rw: 'رواندا',
  bl: 'سان بارتيلمي',
  sh: 'سانت هيلانة',
  kn: 'سانت كيتس ونيفيس',
  lc: 'سانت لوسيا',
  mf: 'سانت مارتن',
  pm: 'سان بيير وميكلون',
  vc: 'سانت فينسنت والغرينادين',
  ws: 'ساموا',
  sm: 'سان مارينو',
  st: 'ساو تومي وبرينسيب',
  sa: 'المملكة العربية السعودية',
  sn: 'السنغال',
  rs: 'صربيا',
  sc: 'سيشل',
  sl: 'سيراليون',
  sg: 'سنغافورة',
  sx: 'سينت مارتن',
  sk: 'سلوفاكيا',
  si: 'سلوفينيا',
  sb: 'جزر سليمان',
  so: 'الصومال',
  za: 'جنوب أفريقيا',
  kr: 'كوريا الجنوبية',
  ss: 'جنوب السودان',
  es: 'إسبانيا',
  lk: 'سريلانكا',
  sd: 'السودان',
  sr: 'سورينام',
  sz: 'إسواتيني',
  se: 'السويد',
  ch: 'سويسرا',
  sy: 'سوريا',
  tw: 'تايوان',
  tj: 'طاجيكستان',
  tz: 'تنزانيا',
  th: 'تايلاند',
  tl: 'تيمور الشرقية',
  tg: 'توغو',
  tk: 'توكيلاو',
  to: 'تونغا',
  tt: 'ترينيداد وتوباغو',
  tn: 'تونس',
  tr: 'تركيا',
  tm: 'تركمانستان',
  tc: 'جزر توركس وكايكوس',
  tv: 'توفالو',
  ug: 'أوغندا',
  ua: 'أوكرانيا',
  ae: 'الإمارات العربية المتحدة',
  gb: 'المملكة المتحدة',
  us: 'الولايات المتحدة',
  uy: 'أوروغواي',
  uz: 'أوزبكستان',
  vu: 'فانواتو',
  va: 'الفاتيكان',
  ve: 'فنزويلا',
  vn: 'فيتنام',
  vi: 'جزر العذراء الأمريكية',
  wf: 'واليس وفوتونا',
  eh: 'الصحراء الغربية',
  ye: 'اليمن',
  zm: 'زامبيا',
  zw: 'زيمبابوي',
};

/**
 * Returns clean localized country name.
 * - For 'ar': returns Arabic only.
 * - For 'en': returns English only (parentheses stripped).
 */
export function getLocalizedCountryName(
  originalName: string,
  iso2?: string,
  lang: 'ar' | 'en' = 'en'
): string {
  if (!originalName) return '';

  const cleanIso = (iso2 || '').toLowerCase().trim();

  if (lang === 'ar') {
    if (cleanIso && ARABIC_COUNTRIES_BY_ISO[cleanIso]) {
      return ARABIC_COUNTRIES_BY_ISO[cleanIso];
    }
    // Check if original name has Arabic inside parentheses: e.g. "Pakistan (پاکستان)"
    const match = originalName.match(/\(([\u0600-\u06FF\s]+)\)/);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
    // Fallback: strip parentheses
    return originalName.replace(/\s*\([^)]*\)/g, '').trim();
  }

  // English: strip any parentheses containing native or localized text
  return originalName.replace(/\s*\([^)]*\)/g, '').trim();
}

/**
 * Applies localized names to an NgxIntlTelInputComponent instance and its DOM list.
 */
export function localizeIntlTelInput(
  intlTelComponent: any,
  hostElement?: HTMLElement | null,
  lang: 'ar' | 'en' = 'en'
): void {
  if (!intlTelComponent) return;

  const isAr = lang === 'ar';

  if (Array.isArray(intlTelComponent.allCountries)) {
    intlTelComponent.allCountries.forEach((c: any) => {
      if (!c._rawOriginalName) {
        c._rawOriginalName = c.name;
      }
      c.name = getLocalizedCountryName(c._rawOriginalName, c.iso2, isAr ? 'ar' : 'en');
    });
  }

  if (Array.isArray(intlTelComponent.preferredCountriesInDropDown)) {
    intlTelComponent.preferredCountriesInDropDown.forEach((c: any) => {
      if (!c._rawOriginalName) {
        c._rawOriginalName = c.name;
      }
      c.name = getLocalizedCountryName(c._rawOriginalName, c.iso2, isAr ? 'ar' : 'en');
    });
  }

  if (intlTelComponent.selectedCountry) {
    const sc = intlTelComponent.selectedCountry;
    if (!sc._rawOriginalName) {
      sc._rawOriginalName = sc.name;
    }
    sc.name = getLocalizedCountryName(sc._rawOriginalName, sc.iso2, isAr ? 'ar' : 'en');
  }

  // Also sync the DOM items if hostElement is present
  if (hostElement) {
    const listItems = hostElement.querySelectorAll<HTMLLIElement>('.iti__country-list li.iti__country');
    listItems.forEach(li => {
      const iso = (li.getAttribute('data-country-code') || '').toLowerCase().trim();
      const nameSpan = li.querySelector<HTMLElement>('.iti__country-name');
      if (nameSpan) {
        const text = nameSpan.textContent || '';
        nameSpan.textContent = getLocalizedCountryName(text, iso, isAr ? 'ar' : 'en');
      }
    });

    const searchInput = hostElement.querySelector<HTMLInputElement>('#country-search-box');
    if (searchInput) {
      searchInput.placeholder = isAr ? 'البحث عن الدولة' : 'Search Country';
    }
  }
}

