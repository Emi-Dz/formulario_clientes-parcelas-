
// This file is NOT part of the frontend application.
// This is the code you must paste into the Google Apps Script editor
// associated with your Google Sheet.

// The sheet name you want to write data to.
const SHEET_NAME = "Clientes"; 

/**
 * This function is the entry point for POST requests to your Web App URL.
 * It receives data from the frontend, parses it, and appends it to the specified Google Sheet.
 * @param {object} e - The event parameter for a POST request.
 */
function doPost(e) {
  try {
    // Open the spreadsheet by its ID (or the one this script is bound to).
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // If the sheet doesn't exist, create it with the headers.
    if (!sheet) {
      throw new Error(`Sheet with name "${SHEET_NAME}" not found.`);
    }

    // Parse the JSON data sent from the frontend.
    // The data is located in e.postData.contents.
    // We expect an object like { rowData: [...] }
    const postData = JSON.parse(e.postData.contents);
    const rowData = postData.rowData;

    // Validate that we received an array.
    if (!Array.isArray(rowData)) {
      throw new Error("Invalid data format received. Expected an array in 'rowData'.");
    }

    // Append the array as a new row in the sheet.
    sheet.appendRow(rowData);

    // Return a success response.
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "message": "Row added." }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log the error for debugging purposes (View logs in Apps Script editor).
    console.error("Error in doPost:", error);
    
    // Return a structured error response to the client.
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
