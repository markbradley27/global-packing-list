function calculateToPackByCategory(
  selectedTags: ReadonlySet<String>,
  packablesGroups: ReadonlyArray<PackablesGroup>,
): ReadonlyArray<ToPackGroup> {
  const toPackGroups = new Array<ToPackGroup>();
  for (const packableGroup of packablesGroups) {
    const toPack = new Array<string>();
    for (const packable of packableGroup.packables) {
      if (
        packable.inclusions.some((inclusion) =>
          inclusion.every((tag) => selectedTags.has(tag)),
        )
      ) {
        toPack.push(packable.name);
      }
    }
    if (toPack.length > 0) {
      toPackGroups.push({
        name: packableGroup.name,
        toPack,
      });
    }
  }
  return toPackGroups;
}
