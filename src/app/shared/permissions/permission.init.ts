import { PermissionService } from "./permission.service";

export function permissionInitializer(perms: PermissionService) {
    return () => {
        perms.refreshForCurrentUser$().subscribe({
            next: () => console.log('Permissions loaded!'),
            error: err => console.warn('Permissions load failed!', err)
        });
        return Promise.resolve();
    };
}