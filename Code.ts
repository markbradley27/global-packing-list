const PACKING_LIST_SHEET_NAME = "Packing List";

const PACKING_LIST_ROW_START = 1;
const PACKING_LIST_COL_START = 2;

const CATEGORY_LABEL_TEXT_STYLE = SpreadsheetApp.newTextStyle()
  .setBold(true)
  .build();
const FADED_PACKING_LIST_TEXT_STYLE = SpreadsheetApp.newTextStyle()
  .setItalic(true)
  .setForegroundColor("#B7B7B7")
  .build();

function getPackingListSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    PACKING_LIST_SHEET_NAME,
  );
}

function getPackingListSelectionsCol() {
  return getPackingListSheet().getRange("A:A");
}

function getSelectedTags(): ReadonlySet<string> {
  const selectionsCol = getPackingListSelectionsCol();
  const allTags = new Set<string>();
  for (let i = 1; i <= selectionsCol.getLastRow(); i++) {
    Logger.log(`getSelectedTags i: ${i}`);
    const cell = selectionsCol.getCell(i, 1);

    // Skip title cells (which we assume are always bold).
    if (cell.getTextStyle().isBold()) {
      continue;
    }

    const cellTags = String(cell.getValue())
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0);
    for (const cellTag of cellTags) {
      allTags.add(cellTag);
    }
  }
  return allTags;
}

function getPackableSheets() {
  const packingListSheet = getPackingListSheet();
  return SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()
    .filter((sheet) => sheet.getSheetId() !== packingListSheet.getSheetId());
}

type Inclusion = ReadonlyArray<string>;

interface Packable {
  name: string;
  inclusions: ReadonlyArray<Inclusion>;
}

interface PackablesCategory {
  name: string;
  packables: ReadonlyArray<Packable>;
}

function getPackablesByCategory(): ReadonlyArray<PackablesCategory> {
  return getPackableSheets().map((packableSheet) => {
    const data = packableSheet.getDataRange();
    const packables = new Array<Packable>();

    for (let rowI = 1; rowI <= data.getLastRow(); rowI++) {
      const name = data.getCell(rowI, 1).getValue();
      if (name === "") {
        continue;
      }

      const inclusions = new Array<Inclusion>();
      for (let colI = 2; colI <= data.getLastColumn(); colI++) {
        const inclusion = String(data.getCell(rowI, colI).getValue())
          .split("+")
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s.length > 0);
        if (inclusion.length > 0) {
          inclusions.push(inclusion);
        }
      }

      packables.push({
        name,
        inclusions,
      });
    }

    return {
      name: packableSheet.getName(),
      packables,
    };
  });
}

interface ToPackCategory {
  name: string;
  toPack: ReadonlyArray<string>;
}

function calculateToPackByCategory(
  selectedTags: ReadonlySet<String>,
  packablesByCategory: ReadonlyArray<PackablesCategory>,
): ReadonlyArray<ToPackCategory> {
  const toPackByCategory = new Array<ToPackCategory>();
  for (const category of packablesByCategory) {
    const toPack = new Array<string>();
    for (const packable of category.packables) {
      if (
        packable.inclusions.some((inclusion) =>
          inclusion.every((tag) => selectedTags.has(tag)),
        )
      ) {
        toPack.push(packable.name);
      }
    }
    if (toPack.length > 0) {
      toPackByCategory.push({
        name: category.name,
        toPack,
      });
    }
  }
  return toPackByCategory;
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
    .setTextStyle(FADED_PACKING_LIST_TEXT_STYLE);
}

function outputPackingList(toPackByCategory: ReadonlyArray<ToPackCategory>) {
  clearPackingList();

  const packingListSheet = getPackingListSheet();

  for (let categoryI = 0; categoryI < toPackByCategory.length; categoryI++) {
    const category = toPackByCategory[categoryI];
    packingListSheet
      .getRange(PACKING_LIST_ROW_START, PACKING_LIST_COL_START + categoryI)
      .setTextStyle(CATEGORY_LABEL_TEXT_STYLE)
      .setValue(category.name);
    for (let toPackI = 0; toPackI < category.toPack.length; toPackI++) {
      packingListSheet
        .getRange(
          PACKING_LIST_ROW_START + toPackI + 1,
          PACKING_LIST_COL_START + categoryI,
        )
        .setValue(category.toPack[toPackI]);
    }
  }
}

function onEdit() {
  fadePackingList();

  const selectedTags = getSelectedTags();
  const packablesByCategory = getPackablesByCategory();

  const toPackByCategory = calculateToPackByCategory(
    selectedTags,
    packablesByCategory,
  );

  outputPackingList(toPackByCategory);
}
