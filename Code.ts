function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit) {
  SpreadsheetApp.getUi().alert(`got an edit: ${e}`);
}
