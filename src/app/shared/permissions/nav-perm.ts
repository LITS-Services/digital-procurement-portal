export function filterNavByPerm(
    items: any[],
    canRead: (id?: number | string) => boolean,
    hasAnyRole?: (roles: string[]) => boolean
): any[] {
    if (!Array.isArray(items)) return [];

    const result: any[] = [];

    for (const item of items) {
        const hasForm = item.formTypeId !== undefined && item.formTypeId !== null;
        const hasRoles = Array.isArray(item.roles) && item.roles.length > 0;
        const hasChildren = Array.isArray(item.submenu) && item.submenu.length > 0;

        const formAllowed = hasForm ? canRead(item.formTypeId!) : true;
        const roleAllowed = hasRoles ? !!hasAnyRole?.(item.roles) : true;
        const allowedSelf = formAllowed && roleAllowed;

        const filteredChildren = hasChildren
            ? filterNavByPerm(item.submenu, canRead, hasAnyRole)
            : [];

        if (!allowedSelf) continue;
        // Folder items (Configuration, Setup) have no form of their own — hide them
        // when ACL or Super ACL has removed every child.
        if (hasChildren && filteredChildren.length === 0) continue;

        result.push({
            ...item,
            submenu: hasChildren ? filteredChildren : (item.submenu ?? [])
        });
    }

    return result;
}

/** First sidebar route the user can read, matching visible menu order. */
export function firstReadableNavPath(
    items: any[],
    canRead: (id: number | string) => boolean
): string | null {
    if (!Array.isArray(items)) return null;

    for (const item of items) {
        if (item?.submenu?.length) {
            const child = firstReadableNavPath(item.submenu, canRead);
            if (child) return child;
            continue;
        }

        if (!item?.path || item.isExternalLink) continue;
        if (Array.isArray(item.roles) && item.roles.length) continue;
        if (item.formTypeId != null && item.formTypeId !== undefined && !canRead(item.formTypeId)) continue;
        if (item.formTypeId == null || item.formTypeId === undefined) continue;

        return item.path;
    }

    return null;
}