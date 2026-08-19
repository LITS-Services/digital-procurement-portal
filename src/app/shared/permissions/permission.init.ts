import { PermissionService } from "./permission.service";
import { AuthService } from "../auth/auth.service";
import { switchMap } from "rxjs/operators";
import { of } from "rxjs";

export function permissionInitializer(perms: PermissionService, auth: AuthService) {
    return () => {
        return auth.restoreSession$().pipe(
            switchMap(ok => ok ? perms.refreshForCurrentUser$() : of(void 0))
        ).toPromise();
    };
}
