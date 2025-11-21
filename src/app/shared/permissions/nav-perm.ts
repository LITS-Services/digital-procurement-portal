// export function filterNavByPerm(items: any[], canRead: (id: number | string) => boolean): any[] {
//     if (!Array.isArray(items)) return [];
//     const result: any[] = [];

//     for (const item of items) {
//         const hasForm = item.formTypeId !== undefined && item.formTypeId !== null;
//         const allowedSelf = hasForm ? canRead(item.formTypeId!) : true;

//         const filteredChildren = item.submenu ? filterNavByPerm(item.submenu, canRead) : undefined;


//         const shouldKeep =
//             (hasForm ? allowedSelf : true) &&
//             (!item.submenu || (filteredChildren && filteredChildren.length > 0));

//         if (shouldKeep) {

//             result.push({
//                 ...item,
//                 submenu: filteredChildren,
//             });
//         }
//     }
//     return result;
// }
export function filterNavByPerm(items: any[], canRead: (id?: number | string) => boolean): any[] {
    if (!Array.isArray(items)) return [];

    const result: any[] = [];

    for (const item of items) {
        const hasForm = item.formTypeId !== undefined && item.formTypeId !== null;

        // Only check permission if formTypeId exists
        const allowedSelf = hasForm ? canRead(item.formTypeId!) : true;

        // Filter children recursively
        const filteredChildren = item.submenu ? filterNavByPerm(item.submenu, canRead) : [];

        // Keep item if parent has permission
        if (allowedSelf) {
            result.push({
                ...item,
                submenu: filteredChildren
            });
        }
    }

    return result;
}