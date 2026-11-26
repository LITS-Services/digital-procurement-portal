/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}
declare module 'quill';
declare module 'leaflet';
declare module 'screenfull';
declare module 'd3-shape';

declare module 'google-libphonenumber' {
  export enum PhoneNumberFormat {
    E164 = 0,
    INTERNATIONAL = 1,
    NATIONAL = 2,
    RFC3966 = 3
  }

  export enum PhoneNumberType {
    FIXED_LINE = 0,
    MOBILE = 1,
    FIXED_LINE_OR_MOBILE = 2,
    TOLL_FREE = 3,
    PREMIUM_RATE = 4,
    SHARED_COST = 5,
    VOIP = 6,
    PERSONAL_NUMBER = 7,
    PAGER = 8,
    UAN = 9,
    VOICEMAIL = 10,
    UNKNOWN = -1
  }

  export interface PhoneNumber {
    getCountryCode(): number | undefined;
    getNationalNumber(): number | undefined;
  }

  export class PhoneNumberUtil {
    static getInstance(): PhoneNumberUtil;
    getSupportedRegions(): string[];
    getCountryCodeForRegion(regionCode: string): number;
    getExampleNumber(regionCode: string): PhoneNumber | null;
    getExampleNumberForType(regionCode: string, type: PhoneNumberType): PhoneNumber | null;
    parse(numberToParse: string, defaultRegion?: string): PhoneNumber;
    parseAndKeepRawInput(numberToParse: string, defaultRegion?: string): PhoneNumber;
    isValidNumber(number: PhoneNumber): boolean;
    isValidNumberForRegion(number: PhoneNumber, regionCode: string): boolean;
    getRegionCodeForNumber(number: PhoneNumber): string | undefined;
    format(number: PhoneNumber, numberFormat: PhoneNumberFormat): string;
  }
}
