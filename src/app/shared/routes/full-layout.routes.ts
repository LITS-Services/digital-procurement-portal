import { Routes, RouterModule } from '@angular/router';

//Route for content layout with sidebar, navbar and footer.

export const Full_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadChildren: () => import('../../dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'purchase-request',
    loadChildren: () => import('../../purchase-request/purchase-request.module').then(m => m.PurchaseRequestModule)
  },
  {
    path: 'rfq',
    loadChildren: () => import('../../rfq/rfq.module').then(m => m.RFQModule)
  },
  {
    path: 'purchase-order',
    loadChildren: () => import('../../purchase-order/purchase-order.module').then(m => m.PurchaseOrderModule)
  },
   {
    path: 'inventory-transfer',
    loadChildren: () => import('../../inventory-transfer/inventory-transfer.module').then(m => m.InventoryTransferModule)
  },
  {
    path: 'tendering',
    loadChildren: () => import('../../tendering/tendering.module').then(m => m.TenderingModule)
  },

  {
    path: 'procurment-companies',
    loadChildren: () => import('../../procurment-companies/procurment-companies.module').then(m => m.ProcurmentCompaniesModule)
  },
  {
    path: 'company',
    loadChildren: () => import('../../company/company.module').then(m => m.CompanyModule)
  },
  {
    path: 'calendar',
    loadChildren: () => import('../../calendar/calendar.module').then(m => m.CalendarsModule)
  },
  {
    path: 'employee',
    loadChildren: () => import('../../employee/employee.module').then(m => m.EmployeeModule)
  },
  {
    path: 'employee-list',
    loadChildren: () => import('../../employee-list/employee-list.module').then(m => m.EmployeeListModule)
  },
  {
    path: 'charts',
    loadChildren: () => import('../../charts/charts.module').then(m => m.ChartsNg2Module)
  },
  {
    path: 'forms',
    loadChildren: () => import('../../forms/forms.module').then(m => m.FormModule)
  },
  {
    path: 'maps',
    loadChildren: () => import('../../maps/maps.module').then(m => m.MapsModule)
  },
  {
    path: 'tables',
    loadChildren: () => import('../../tables/tables.module').then(m => m.TablesModule)
  },
  {
    path: 'datatables',
    loadChildren: () => import('../../data-tables/data-tables.module').then(m => m.DataTablesModule)
  },
  {
    path: 'uikit',
    loadChildren: () => import('../../ui-kit/ui-kit.module').then(m => m.UIKitModule)
  },
  {
    path: 'setup',
    loadChildren: () => import('../../setup/setup.module').then(m => m.SetupModule)
  },
    {
    path: 'configuration',
    loadChildren: () => import('../../configuration/configuration.module').then(m => m.ConfigurationModule)
  },
  {
    path: 'components',
    loadChildren: () => import('../../components/ui-components.module').then(m => m.UIComponentsModule)
  },
  {
    path: 'pages',
    loadChildren: () => import('../../pages/full-pages/full-pages.module').then(m => m.FullPagesModule)
  },
  {
    path: 'cards',
    loadChildren: () => import('../../cards/cards.module').then(m => m.CardsModule)
  },
  {
    path: 'chat',
    loadChildren: () => import('../../chat/chat.module').then(m => m.ChatModule)
  },
  {
    path: 'chat-ngrx',
    loadChildren: () => import('../../chat-ngrx/chat-ngrx.module').then(m => m.ChatNGRXModule)
  },
  {
    path: 'inbox',
    loadChildren: () => import('../../inbox/inbox.module').then(m => m.InboxModule)
  },
  {
    path: 'taskboard',
    loadChildren: () => import('../../taskboard/taskboard.module').then(m => m.TaskboardModule)
  },
  {
    path: 'taskboard-ngrx',
    loadChildren: () => import('../../taskboard-ngrx/taskboard-ngrx.module').then(m => m.TaskboardNGRXModule)
  }
];
