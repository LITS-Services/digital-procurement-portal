// Sidebar route metadata
export interface RouteInfo {
    path: string;
    title: string;
    icon: string;
    class: string;
    badge?: string;
    badgeClass?: string;
    isExternalLink: boolean;
    formTypeId?: number | string;
    submenu : RouteInfo[];
      roles?: string[]; // ✅ add this line

}
