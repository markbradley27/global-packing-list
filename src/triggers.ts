function onEdit() {
  fadePackingList();

  const clearBox = getClearBox();
  if (clearBox.getValue()) {
    clearSelectedTags();
    clearBox.clear();
  }

  const selectedTags = getSelectedTags();
  const packablesGroups = getPackablesGroups();

  const toPackByCategory = calculateToPackByCategory(
    selectedTags,
    packablesGroups,
  );

  setPackingList(toPackByCategory);
}
