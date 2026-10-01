export type DataSourceMode = 'local' | 'businessCentral';

export interface DataSourceFormOption {
  key: string;
  label: string;
  route: string;
}

/** Shown on the checklist before Add More Forms is used. */
export const DATA_SOURCE_FORMS: readonly DataSourceFormOption[] = [
  { key: 'purchase-request', label: 'Purchase Requests', route: '/purchase-request' },
  { key: 'rfq', label: 'Request for Quotations', route: '/rfq' },
  { key: 'purchase-order', label: 'Purchase Orders', route: '/purchase-order' },
  { key: 'vendor-companies', label: 'Vendor Companies', route: '/company' },
  { key: 'inventory-transfer', label: 'Inventory Transfers', route: '/inventory-transfer' },
];

/** Catalog of forms that can be synced from Business Central. */
export const DATA_SOURCE_FORM_CATALOG: readonly DataSourceFormOption[] = [
  ...DATA_SOURCE_FORMS,
  { key: 'procurement-users', label: 'Procurement Users', route: '/employee-list' },
  { key: 'entities', label: 'Entities', route: '/procurment-companies' },
  { key: 'vendor-onboarding', label: 'Vendor Onboarding', route: '/setup/vendor-onboarding-setup' },
  { key: 'invitation', label: 'Invitations', route: '/setup/email-setup' },
  { key: 'email-template', label: 'Email Templates', route: '/setup/email-templatelist' },
  { key: 'workflow-setup', label: 'Workflow Setup', route: '/setup/workflow' },
];

/** Checked by default when Business Central mode is turned on for the first time. */
export const DEFAULT_BUSINESS_CENTRAL_FORMS = [
  'purchase-order',
  'vendor-companies',
  'inventory-transfer'
] as const;

export const DEFAULT_LISTED_FORMS = DATA_SOURCE_FORMS.map(form => form.key);

export interface DataSourceState {
  mode: DataSourceMode;
  businessCentralForms: string[];
  listedForms: string[];
}

export const DEFAULT_DATA_SOURCE_STATE: DataSourceState = {
  mode: 'local',
  businessCentralForms: [...DEFAULT_BUSINESS_CENTRAL_FORMS],
  listedForms: [...DEFAULT_LISTED_FORMS],
};

const DATA_SOURCE_FORM_KEYS = new Set(DATA_SOURCE_FORM_CATALOG.map(form => form.key));

export const FORM_ID_TO_DATA_SOURCE_KEY: Record<string | number, string> = {
  1: 'purchase-request',
  2: 'rfq',
  3: 'purchase-order',
  4: 'vendor-companies',
  6: 'procurement-users',
  7: 'entities',
  11: 'workflow-setup',
  12: 'vendor-onboarding',
  13: 'invitation',
  14: 'email-template',
  16: 'inventory-transfer',
  '/purchase-request': 'purchase-request',
  '/rfq': 'rfq',
  '/purchase-order': 'purchase-order',
  '/company': 'vendor-companies',
  '/employee-list': 'procurement-users',
  '/procurment-companies': 'entities',
  '/setup/vendor-onboarding-setup': 'vendor-onboarding',
  '/setup/email-setup': 'invitation',
  '/setup/email-templatelist': 'email-template',
  '/setup/workflow': 'workflow-setup',
  '/inventory-transfer': 'inventory-transfer',
  'purchase-request': 'purchase-request',
  'rfq': 'rfq',
  'purchase-order': 'purchase-order',
  'vendor-companies': 'vendor-companies',
  'inventory-transfer': 'inventory-transfer',
  'procurement-users': 'procurement-users',
  'entities': 'entities',
  'vendor-onboarding': 'vendor-onboarding',
  'invitation': 'invitation',
  'email-template': 'email-template',
  'workflow-setup': 'workflow-setup',
};

export function toDataSourceKey(idOrRouteOrKey: number | string | undefined | null): string | null {
  if (idOrRouteOrKey === undefined || idOrRouteOrKey === null) return null;
  const str = String(idOrRouteOrKey).trim().toLowerCase();
  if (FORM_ID_TO_DATA_SOURCE_KEY[str]) return FORM_ID_TO_DATA_SOURCE_KEY[str];
  const num = Number(idOrRouteOrKey);
  if (!isNaN(num) && FORM_ID_TO_DATA_SOURCE_KEY[num]) return FORM_ID_TO_DATA_SOURCE_KEY[num];
  return null;
}

export function isDataSourceForm(key: string): boolean {
  return DATA_SOURCE_FORM_KEYS.has(key.toLowerCase());
}

function knownFormKeys(raw: unknown, fallback: readonly string[]): string[] {
  if (!Array.isArray(raw)) return [...fallback];
  return Array.from(new Set(
    raw
      .map(value => String(value).trim().toLowerCase())
      .filter(key => DATA_SOURCE_FORM_KEYS.has(key))
  ));
}

export function normalizeDataSourceState(raw: unknown): DataSourceState {
  if (!raw || typeof raw !== 'object') {
    return {
      mode: DEFAULT_DATA_SOURCE_STATE.mode,
      businessCentralForms: [...DEFAULT_DATA_SOURCE_STATE.businessCentralForms],
      listedForms: [...DEFAULT_DATA_SOURCE_STATE.listedForms],
    };
  }

  const source = raw as Record<string, unknown>;
  const modeRaw = source['mode'] ?? source['Mode'];
  const mode: DataSourceMode = modeRaw === 'businessCentral' ? 'businessCentral' : 'local';
  const businessCentralForms = knownFormKeys(
    source['businessCentralForms'] ?? source['BusinessCentralForms'],
    DEFAULT_BUSINESS_CENTRAL_FORMS
  );
  const listedForms = knownFormKeys(
    source['listedForms'] ?? source['ListedForms'],
    DEFAULT_LISTED_FORMS
  );

  for (const key of DEFAULT_LISTED_FORMS) {
    if (!listedForms.includes(key)) {
      listedForms.push(key);
    }
  }

  return { mode, businessCentralForms, listedForms };
}
