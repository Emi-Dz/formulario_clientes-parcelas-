// This file is NOT part of the frontend application.
// This is the code you must paste into the Google Apps Script editor
// associated with your Google Sheet.

// The sheet name you want to write data to.
const SHEET_NAME = "Clientes"; 

/**
 * This function handles the browser's preflight OPTIONS request, which is a security
 * check made before the actual POST request. It returns the necessary CORS headers.
 * @param {object} e - The event parameter for an OPTIONS request.
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*', // Allows requests from any origin. For higher security, replace '*' with your Vercel app's URL.
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
}

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

    // If the sheet doesn't exist, throw an error.
    if (!sheet) {
      throw new Error(`Sheet with name "${SHEET_NAME}" not found.`);
    }

    // Parse the JSON data sent from the frontend.
    const postData = JSON.parse(e.postData.contents);
    const rowData = postData.rowData;

    // Validate that we received an array.
    if (!Array.isArray(rowData)) {
      throw new Error("Invalid data format received. Expected an array in 'rowData'.");
    }

    // Append the array as a new row in the sheet.
    sheet.appendRow(rowData);

    // Return a success response with CORS header.
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "message": "Row added." }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*'
      });

  } catch (error) {
    // Log the error for debugging purposes (View logs in Apps Script editor).
    console.error("Error in doPost:", error);
    
    // Return a structured error response to the client with CORS header.
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": error.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders({
        'Access-Control-Allow-Origin': '*'
      });
  }
}
