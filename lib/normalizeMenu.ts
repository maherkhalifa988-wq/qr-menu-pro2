// دالة صغيرة وآمنة: تضمن أن groups/items مصفوفات صحيحة وأن groupId نصي وموجود
function sanitizeMenu(rawGroups: any, rawItems: any) {
  const groupsArr = Array.isArray(rawGroups)
    ? rawGroups
    : Array.isArray(rawGroups?.groups)
    ? rawGroups.groups
    : Array.isArray(rawGroups?.categories)
    ? rawGroups.categories
    : [];

  const itemsArr = Array.isArray(rawItems)
    ? rawItems
    : Array.isArray(rawItems?.items)
    ? rawItems.items
    : Array.isArray(rawItems?.products)
    ? rawItems.products
    : [];

  const groups = groupsArr.map((g: any, i: number) => ({
    id: (g.id ?? g._id ?? String(i + 1)).toString(),
    nameAr: g.nameAr ?? g.titleAr ?? g.ar ?? g.name_ar ?? 'بدون اسم',
    nameEn: g.nameEn ?? g.titleEn ?? g.en ?? g.name_en ?? 'Untitled',
    imageUrl: g.imageUrl ?? g.img ?? g.image ?? undefined,
  }));

  const validGroupIds = new Set(groups.map((g: any) => g.id));

  // أي صنف بلا groupId صحيح → يتم تجاهله حتى لا يسبّب كراش
  const items = itemsArr
    .map((x: any, i: number) => ({
      id: (x.id ?? x._id ?? String(i + 1)).toString(),
      groupId: (
        x.groupId ??
        x.categoryId ??
        x.group?.id ??
        x.category?._id ??
        x.group_id ??
        ''
      ).toString(),
      nameAr: x.nameAr ?? x.titleAr ?? x.ar ?? x.name_ar ?? 'بدون اسم',
      nameEn: x.nameEn ?? x.titleEn ?? x.en ?? x.name_en ?? 'Untitled',
      imageUrl: x.imageUrl ?? x.img ?? x.image ?? undefined,
      price: typeof x.price === 'number' ? x.price : undefined,
    }))
    .filter((it: any) => validGroupIds.has(it.groupId));

  return { groups, items };
}
