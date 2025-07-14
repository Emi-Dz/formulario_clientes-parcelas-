
/**
 * Fetches the list of clients from the read-only Google Apps Script endpoint.
 *
 * @returns {Promise<SaleData[]>} - A promise that resolves to an array of client data.
 */
export const fetchClients = async (): Promise<SaleData[]> => {
    const READ_URL = import.meta.env.VITE_GOOGLE_SHEETS_READ_URL;

    if (!READ_URL) {
        console.warn("VITE_GOOGLE_SHEETS_READ_URL is not defined. Cannot fetch clients.");
        return [];
    }

    try {
        const response = await fetch(READ_URL, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            throw new Error(`Failed to fetch clients: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        // The Apps Script might return an object with an error key
        if (data.error) {
            throw new Error(`Error from Google Sheets script: ${data.error}`);
        }
        return data as SaleData[];
    } catch (error) {
        console.error("Error fetching clients from Google Sheets:", error);
        // Re-throw the error so the calling component can handle it
        throw error;
    }
};


/**
 * Sends sale data to a secure Google Apps Script endpoint which then appends
 * it to a Google Sheet.
 *
 * @param {SaleData} data - The sale data to be sent.
 * @returns {Promise<boolean>} - True if the data was sent successfully or if the integration is not configured, false on a network or API error.
 */
export const sendToGoogleSheets = async (data: SaleData): Promise<boolean> => {
    // Vite exposes environment variables prefixed with VITE_ on the import.meta.env object.
    const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

    if (!GOOGLE_APPS_SCRIPT_URL) {
        console.warn("--- Google Sheets Integration ---");
        console.warn("VITE_GOOGLE_APPS_SCRIPT_URL is not defined. Skipping Google Sheets submission.");
        console.warn("This is normal for local development if not configured. For production, ensure this variable is set in your hosting environment (e.g., Vercel).");
        // The step didn't fail, it was intentionally skipped.
        return true;
    }
    
    // Helper to format language data
    const languages = data.language ? data.language.toUpperCase() : '';

    // Helper to split full name into first and last name
    const nameParts = data.clientFullName.trim().split(/\s+/);
    const firstName = nameParts.shift() || '';
    const lastName = nameParts.join(' ');

    // Helper to format reference strings
    const reference1 = `${data.reference1Name} (${data.reference1Relationship})`;
    const reference2 = `${data.reference2Name} (${data.reference2Relationship})`;

    // The order of this array MUST match the column order in the Google Sheet.
    const rowData = [
        data.timestamp,
        '', // Placeholder for Email, as per sheet structure
        data.vendedor,
        data.clientCpf,
        languages,
        firstName,
        lastName,
        data.purchaseDate,
        data.phone,
        data.product,
        data.paymentSystem,
        data.installments,
        data.installmentPrice.toFixed(2),
        data.totalProductPrice,
        data.downPayment,
        `${data.paymentStartDate} ${reference1}`,
        reference2,
        data.storeName,
        data.workAddress,
        data.homeAddress,
        data.notes,
        data.photoStoreFileName || 'No',
        data.photoHomeFileName || 'No',
        '', // Placeholder for 'FOTO CARA COM O PRODUTO'
        `Frente: ${data.photoIdFrontFileName || 'No'}, Verso: ${data.photoIdBackFileName || 'No'}`,
        data.photoInstagramFileName || 'No',
        `Frente: ${data.photoContractFrontFileName || 'No'}, Verso: ${data.photoContractBackFileName || 'No'}`,
        data.photoPhoneCodeFileName || 'No',
        data.workLocation,
        data.homeLocation,
    ];
    
    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', // Explicitly set mode for clarity
            redirect: 'follow', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rowData }),
        });

        if (!response.ok) {
            // Try to get more detailed error from the response body
            const errorBody = await response.text();
            console.error(`Google Sheets API Error: Request failed with status ${response.status}. Response: ${errorBody}`);
            return false;
        }

        console.log('Data successfully sent to Google Sheets.');
        return true;

    } catch (error) {
        console.error('Error in sendToGoogleSheets:', error);
        // Provide a more user-friendly message for common network errors
        if (error instanceof TypeError) { // Often indicates a network or CORS issue
             console.error("A network error occurred. This could be a connection issue or, more likely, a CORS problem. Ensure the Google Apps Script is deployed correctly with CORS headers and 'Access-Control-Allow-Origin' set to '*' or your Vercel domain.");
        }
        return false;
    }
};
