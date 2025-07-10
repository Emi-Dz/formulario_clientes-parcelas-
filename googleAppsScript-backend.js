// This is the NEW READ-ONLY script.
// This should be deployed as a new web app, and its URL used for VITE_GOOGLE_SHEETS_READ_URL.
// It safely exposes client data without allowing write access.

const SHEET_NAME = "Clientes";

// This is the map of Google Sheet columns (A=0, B=1, etc.) to the keys in our SaleData type.
// It's crucial that this order matches your sheet's layout.
const COLUMN_MAP = {
  0: 'timestamp',
  // 1 is email, skip
  2: 'vendedor',
  3: 'clientCpf',
  4: 'languages', // Special handling
  5: 'clientFullName', // Split from full name
  6: 'clientFullName', // Split from full name
  7: 'purchaseDate',
  8: 'phone',
  9: 'product',
  10: 'paymentSystem',
  11: 'installments',
  12: 'installmentPrice',
  13: 'totalProductPrice',
  14: 'downPayment',
  15: 'paymentStartDate', // Special handling
  16: 'reference2Name', // Special handling
  17: 'storeName',
  18: 'workAddress',
  19: 'homeAddress',
  20: 'notes',
  // Photo fields and locations from here on need to be mapped carefully
  28: 'workLocation',
  29: 'homeLocation',
};


function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return createJsonResponse({ error: `Sheet with name "${SHEET_NAME}" not found.` }, 404);
    }

    // Get all data, from row 2 to the end, to skip the header.
    const dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    const values = dataRange.getValues();

    const clients = values.map((row, index) => {
      const client = {
        id: (index + 2).toString(), // Use row number as a stable ID
      };

      // Map columns based on our COLUMN_MAP
      for (const colIndex in COLUMN_MAP) {
        const key = COLUMN_MAP[colIndex];
        const value = row[colIndex];
        
        if (key === 'clientFullName') {
           // Combine first name (col 5) and last name (col 6)
          client[key] = `${row[5] || ''} ${row[6] || ''}`.trim();
        } else if (key === 'languages') {
           client.languages = {
              es: (value || '').toLowerCase().includes('es'),
              pt: (value || '').toLowerCase().includes('pt'),
           };
        } else if (key === 'paymentStartDate') {
           // Extract only the date part
           client[key] = (value || '').split(' ')[0];
           client.reference1Name = (value || '').substring((value || '').indexOf(' ') + 1);
        } else if (key === 'reference2Name') {
           client[key] = (value || '').split(' (')[0];
           client.reference2Relationship = (value || '').split(' (')[1]?.replace(')','') || '';
        }
        else if (['installments', 'installmentPrice', 'totalProductPrice', 'downPayment'].includes(key)) {
          client[key] = parseFloat(value) || 0;
        }
        else {
          client[key] = value;
        }
      }
      return client;
    }).filter(c => c.clientFullName); // Filter out empty rows

    return createJsonResponse(clients);

  } catch (error) {
    return createJsonResponse({ error: error.message }, 500);
  }
}

function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  // While this is a read-only endpoint, it's good practice to include CORS
  // headers in case of preflight requests or direct browser access.
  output.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  });
  
  // Note: Apps Script doesn't really let you set a status code for the response,
  // but we can structure the response to indicate success or failure.
  return output;
}
