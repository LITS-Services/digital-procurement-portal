import { PermissionService } from "./permission.service";
import { AuthService } from "../auth/auth.service";
import { DataSourceService } from "../services/data-source.service";
import { switchMap } from "rxjs/operators";
import { forkJoin, of } from "rxjs";

export function permissionInitializer(perms: PermissionService, auth: AuthService, dataSource: DataSourceService) {
    return () => {
        return auth.restoreSession$().pipe(
            switchMap(ok => ok ? forkJoin([perms.refreshForCurrentUser$(), dataSource.load()]) : of(void 0))
        ).toPromise();
    };
}
