const PACKING_LIST_SHEET_NAME = "Packing List";
const PACKING_LIST_ROW_START = 4;
const CATEGORY_LABEL_TEXT_STYLE = SpreadsheetApp.newTextStyle()
  .setBold(true)
  .build();

function getPackingListSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
    PACKING_LIST_SHEET_NAME,
  );
}

function getPackingListSelectionsRow() {
  return getPackingListSheet().getRange("A2:2");
}

function getSelectedTags(): ReadonlySet<string> {
  const selectionsRow = getPackingListSelectionsRow();
  const allTags = new Set<string>();
  for (
    let i = selectionsRow.getColumn();
    i <= selectionsRow.getLastColumn();
    i++
  ) {
    const cellTags = String(selectionsRow.getCell(1, i).getValue())
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

function outputPackingList(toPackByCategory: ReadonlyArray<ToPackCategory>) {
  const packingListSheet = getPackingListSheet();

  packingListSheet
    .getRange(
      PACKING_LIST_ROW_START,
      1,
      Math.max(1, packingListSheet.getLastRow() - PACKING_LIST_ROW_START + 1),
      Math.max(1, packingListSheet.getLastColumn() + 1),
    )
    .clear();

  for (let categoryI = 0; categoryI < toPackByCategory.length; categoryI++) {
    const category = toPackByCategory[categoryI];
    packingListSheet
      .getRange(PACKING_LIST_ROW_START, categoryI + 1)
      .setTextStyle(CATEGORY_LABEL_TEXT_STYLE)
      .setValue(category.name);
    for (let toPackI = 0; toPackI < category.toPack.length; toPackI++) {
      packingListSheet
        .getRange(toPackI + PACKING_LIST_ROW_START + 1, categoryI + 1)
        .setValue(category.toPack[toPackI]);
    }
  }
}

function onEdit() {
  const selectedTags = getSelectedTags();
  const packablesByCategory = getPackablesByCategory();

  const toPackByCategory = calculateToPackByCategory(
    selectedTags,
    packablesByCategory,
  );

  outputPackingList(toPackByCategory);
}
