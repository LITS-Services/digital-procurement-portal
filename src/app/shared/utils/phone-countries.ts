import { PhoneNumberFormat, PhoneNumberType, PhoneNumberUtil } from 'google-libphonenumber';

export interface PhoneCountryOption {
  iso: string;
  code: string;
  name: string;
  flagUrl: string;
  label: string;
  triggerLabel: string;
}

export const DEFAULT_PHONE_COUNTRY_ISO = 'qa';

const PRIORITY_COUNTRY_ISOS = ['qa', 'sa', 'ae', 'bh', 'kw', 'om', 'pk', 'ke'];

const phoneUtil = PhoneNumberUtil.getInstance();

const regionNamesEn =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

/** PNG flag URL (renders reliably on Windows where emoji flags render as two-letter codes). */
export function getCountryFlagUrl(iso: string, width = 20): string {
  const code = (iso || '').trim().toLowerCase();
  return code ? `https://flagcdn.com/w${width}/${code}.png` : '';
}

function resolveCountryName(iso: string): string {
  const upper = (iso || '').toUpperCase();
  if (!regionNamesEn) return upper;
  try {
    return regionNamesEn.of(upper) || upper;
  } catch {
    return upper;
  }
}

function buildSortedPhoneCountries(): PhoneCountryOption[] {
  const regions = phoneUtil.getSupportedRegions() || [];
  const all: PhoneCountryOption[] = [];

  for (const region of regions) {
    if (!region || region.length !== 2) continue;
    const callingCode = phoneUtil.getCountryCodeForRegion(region);
    if (!callingCode) continue;

    const iso = region.toLowerCase();
    const code = `+${callingCode}`;
    const name = resolveCountryName(region);

    all.push({
      iso,
      code,
      name,
      flagUrl: getCountryFlagUrl(iso),
      label: `${name} (${code})`,
      triggerLabel: code
    });
  }

  all.sort((a, b) => a.name.localeCompare(b.name, 'en'));

  const prioritized = all
    .filter((c) => PRIORITY_COUNTRY_ISOS.includes(c.iso))
    .sort((a, b) => PRIORITY_COUNTRY_ISOS.indexOf(a.iso) - PRIORITY_COUNTRY_ISOS.indexOf(b.iso));

  const rest = all.filter((c) => !PRIORITY_COUNTRY_ISOS.includes(c.iso));

  return [...prioritized, ...rest];
}

export const PHONE_COUNTRIES: PhoneCountryOption[] = buildSortedPhoneCountries();

const COUNTRY_BY_ISO = new Map<string, PhoneCountryOption>(
  PHONE_COUNTRIES.map((c) => [c.iso, c])
);

const COUNTRIES_BY_CODE_LEN_DESC = [...PHONE_COUNTRIES].sort(
  (a, b) => b.code.length - a.code.length
);

export function getPhoneCountryByIso(iso?: string): PhoneCountryOption {
  const key = (iso || DEFAULT_PHONE_COUNTRY_ISO).trim().toLowerCase();
  return (
    COUNTRY_BY_ISO.get(key) ||
    COUNTRY_BY_ISO.get(DEFAULT_PHONE_COUNTRY_ISO) ||
    PHONE_COUNTRIES[0]
  );
}

export function splitPhoneNumber(
  fullPhone: string,
  defaultIso: string = DEFAULT_PHONE_COUNTRY_ISO
): { countryIso: string; national: string } {
  const fallbackIso = getPhoneCountryByIso(defaultIso).iso;
  const raw = (fullPhone || '').trim();
  if (!raw) {
    return { countryIso: fallbackIso, national: '' };
  }

  const normalized = raw.startsWith('00') ? `+${raw.slice(2)}` : raw;

  if (normalized.startsWith('+')) {
    try {
      const parsed = phoneUtil.parseAndKeepRawInput(normalized);
      const region = phoneUtil.getRegionCodeForNumber(parsed);
      const nationalNum = parsed.getNationalNumber();
      if (region && COUNTRY_BY_ISO.has(region.toLowerCase()) && nationalNum !== undefined) {
        return {
          countryIso: region.toLowerCase(),
          national: String(nationalNum)
        };
      }
    } catch {
      // Fall back to dial-code prefix matching
    }

    const matched = COUNTRIES_BY_CODE_LEN_DESC.find((c) => normalized.startsWith(c.code));
    if (matched) {
      return {
        countryIso: matched.iso,
        national: normalized.slice(matched.code.length).replace(/\D/g, '')
      };
    }
  }

  return {
    countryIso: fallbackIso,
    national: normalized.replace(/\D/g, '')
  };
}

export function formatPhoneNumber(countryIso: string, national: string): string {
  const digits = (national || '').replace(/\D/g, '');
  if (!digits) return '';
  const country = getPhoneCountryByIso(countryIso);
  return `${country.code} ${digits}`;
}

/** National-number placeholder for the selected country (without dial code). */
export function getPhoneNationalPlaceholder(
  countryIso: string,
  preferFixedLine: boolean = false
): string {
  const upperIso = getPhoneCountryByIso(countryIso).iso.toUpperCase();
  try {
    const type = preferFixedLine ? PhoneNumberType.FIXED_LINE : PhoneNumberType.MOBILE;
    const example =
      phoneUtil.getExampleNumberForType(upperIso, type) ||
      phoneUtil.getExampleNumber(upperIso);

    if (!example) return '123456789';

    const callingCode = `+${phoneUtil.getCountryCodeForRegion(upperIso)}`;
    const formattedIntl = phoneUtil.format(example, PhoneNumberFormat.INTERNATIONAL);
    if (formattedIntl.startsWith(callingCode)) {
      return formattedIntl.slice(callingCode.length).trim();
    }

    return String(example.getNationalNumber() || '123456789');
  } catch {
    return '123456789';
  }
}

/** Validates national phone digits against the selected country ISO using libphonenumber. */
export function isValidPhoneForCountry(national: string, countryIso: string): boolean {
  const value = (national || '').trim();
  if (!value) return false;

  const upperIso = getPhoneCountryByIso(countryIso).iso.toUpperCase();
  try {
    const parsed = phoneUtil.parseAndKeepRawInput(value, upperIso);
    return phoneUtil.isValidNumberForRegion(parsed, upperIso);
  } catch {
    return false;
  }
}
