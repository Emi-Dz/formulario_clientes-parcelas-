
import { SaleData } from '../types';

/**
 * Sends sale data to a secure Google Apps Script endpoint which then appends
 * it to a Google Sheet.
 *
 * @param {SaleData} data - The sale data to be sent.
 */
export const sendToGoogleSheets = async (data: SaleData): Promise<void> => {
    // Vite exposes environment variables prefixed with VITE_ on the import.meta.env object.
    const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

    if (!GOOGLE_APPS_SCRIPT_URL) {
        console.warn("--- Google Sheets Integration ---");
        console.warn("VITE_GOOGLE_APPS_SCRIPT_URL is not defined. Skipping Google Sheets submission.");
        console.warn("This is normal for local development if not configured. For production, ensure this variable is set in your hosting environment (e.g., Vercel).");
        // We don't throw an error, allowing the app to function without this integration.
        return;
    }
    
    // Helper to format language data
    const languages = Object.entries(data.languages)
        .filter(([, v]) => v)
        .map(([k]) => k.toUpperCase())
        .join(', ');

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
            const errorBody = await response.json().catch(() => ({ message: 'Could not parse error response body.' }));
            const errorMessage = errorBody.message || `Request failed with status ${response.status}`;
            throw new Error(`Google Sheets API Error: ${errorMessage}`);
        }

        console.log('Data successfully sent to Google Sheets.');

    } catch (error) {
        console.error('Error in sendToGoogleSheets:', error);
        // Re-throw to be caught by the calling function in App.tsx
        // Provide a more user-friendly message for common network errors
        if (error instanceof TypeError) { // Often indicates a network or CORS issue
             throw new Error("A network error occurred. Please check your connection or the backend script's CORS configuration.");
        }
        throw error;
    }
};
