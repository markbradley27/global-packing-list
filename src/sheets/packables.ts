type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

function getPackableSheets() {
  const packingListSheet = getPackingListSheet();
  return SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()
    .filter((sheet) => sheet.getSheetId() !== packingListSheet.getSheetId());
}

function getPackables(sheet: Sheet): ReadonlyArray<Packable> {
  const data = sheet.getDataRange();
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
  return packables;
}

function getPackablesGroups(): ReadonlyArray<PackablesGroup> {
  return getPackableSheets().map((packableSheet) => {
    return {
      name: packableSheet.getName(),
      packables: getPackables(packableSheet),
    };
  });
}

function formatPackableSheet(sheet: Sheet, uniqueColumns?: boolean) {
  const data = sheet.getDataRange();
  const allInclusions = new Set<string>();
  // I tried using a Map<number, Set<string>> here, but iterating over a Map
  // didn't seem to work at all.
  const rowInclusions = new Array<{ row: number; inclusions: Set<string> }>();
  for (let row = 1; row <= data.getHeight(); row++) {
    const name = data.getCell(row, 1).getValue();
    if (name === "") {
      continue;
    }

    const inclusions = new Set<string>();
    for (let col = 2; col <= data.getWidth(); col++) {
      const value = data.getCell(row, col).getValue();
      if (value === "") {
        continue;
      }

      inclusions.add(value);
      allInclusions.add(value);
    }
    rowInclusions.push({ row, inclusions });
  }
  if (uniqueColumns) {
    const allInclusionsSorted = Array.from(allInclusions).sort();

    const neededExtraColumns =
      sheet.getLastColumn() - (allInclusionsSorted.length + 1);
    if (neededExtraColumns > 0) {
      sheet.insertColumns(sheet.getLastColumn(), neededExtraColumns);
    }

    for (const { row, inclusions } of rowInclusions) {
      sheet.getRange(row, 2, 1, sheet.getLastColumn() - 1).clearContent();
      allInclusionsSorted.forEach((inclusion, inclusionI) => {
        if (inclusions.has(inclusion)) {
          sheet.getRange(row, 2 + inclusionI).setValue(inclusion);
        }
      });
    }
  } else {
    for (const { row, inclusions } of rowInclusions) {
      const inclusionsSorted = Array.from(inclusions).sort();
      sheet.getRange(row, 2, 1, sheet.getLastColumn() - 1).clearContent();
      inclusionsSorted.forEach((inclusion, inclusionI) => {
        sheet.getRange(row, 2 + inclusionI).setValue(inclusion);
      });
    }
  }
}

function formatPackables() {
  const packableSheets = getPackableSheets();
  for (const packableSheet of packableSheets) {
    formatPackableSheet(packableSheet);
  }
}

function formatPackablesUniqueColumns() {
  const packableSheets = getPackableSheets();
  for (const packableSheet of packableSheets) {
    formatPackableSheet(packableSheet, true);
  }
}
