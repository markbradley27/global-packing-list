const PACKING_LIST_SHEET_NAME = "Packing List";

const PACKING_LIST_ROW_START = 1;
const PACKING_LIST_COL_START = 3;

const PACKING_LIST_CATEGORY_LABEL_TEXT_STYLE = SpreadsheetApp.newTextStyle()
  .setBold(true)
  .build();
const PACKING_LIST_FADED_TEXT_STYLE = SpreadsheetApp.newTextStyle()
  .setItalic(true)
  .setForegroundColor("#B7B7B7")
  .build();

function getPackingListSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    PACKING_LIST_SHEET_NAME,
  );
}

function getClearBox() {
  return getPackingListSheet().getRange("A1");
}

function getSurveyCols() {
  return getPackingListSheet().getRange("A2:B");
}

function clearSelectedTags() {
  const surveyCols = getSurveyCols();
  for (let i = 1; i <= surveyCols.getHeight(); i++) {
    surveyCols.getCell(i, 1).clear();
  }
}

function getSelectedTags(): ReadonlySet<string> {
  const surveyCols = getSurveyCols();
  const selectedTags = new Set<string>();
  for (let i = 1; i <= surveyCols.getHeight(); i++) {
    const selected = surveyCols.getCell(i, 1).getValue();
    if (selected) {
      const tag = String(surveyCols.getCell(i, 2).getValue())
        .trim()
        .toLowerCase();
      if (tag.length > 0) {
        selectedTags.add(tag);
      }
    }
  }
  return selectedTags;
}

function getPackingListRegion() {
  const packingListSheet = getPackingListSheet();

  return packingListSheet.getRange(
    PACKING_LIST_ROW_START,
    PACKING_LIST_COL_START,
    packingListSheet.getMaxRows() - PACKING_LIST_ROW_START + 1,
    packingListSheet.getMaxColumns() - PACKING_LIST_COL_START + 1,
  );
}

function clearPackingList() {
  getPackingListRegion().clear();
}

function fadePackingList() {
  getPackingListRegion()
    .setBackground("#E8EAED")
    .setTextStyle(PACKING_LIST_FADED_TEXT_STYLE);
}

function setPackingList(toPackGroups: ReadonlyArray<ToPackGroup>) {
  clearPackingList();

  const packingListSheet = getPackingListSheet();

  for (let groupI = 0; groupI < toPackGroups.length; groupI++) {
    const group = toPackGroups[groupI];
    packingListSheet
      .getRange(PACKING_LIST_ROW_START, PACKING_LIST_COL_START + groupI)
      .setTextStyle(PACKING_LIST_CATEGORY_LABEL_TEXT_STYLE)
      .setValue(group.name);
    for (let toPackI = 0; toPackI < group.toPack.length; toPackI++) {
      packingListSheet
        .getRange(
          PACKING_LIST_ROW_START + toPackI + 1,
          PACKING_LIST_COL_START + groupI,
        )
        .setValue(group.toPack[toPackI]);
    }
  }
}
