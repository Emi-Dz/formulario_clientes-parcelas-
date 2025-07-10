import { SaleData } from '../types';

/**
 * Fetches the list of all clients from a secure, read-only Google Apps Script endpoint.
 *
 * @returns {Promise<SaleData[]>} - A promise that resolves to an array of client data.
 * @throws {Error} - Throws an error if the API endpoint is not configured or if the fetch fails.
 */
export const fetchClients = async (): Promise<SaleData[]> => {
    const GOOGLE_SHEETS_READ_URL = import.meta.env.VITE_GOOGLE_SHEETS_READ_URL;

    if (!GOOGLE_SHEETS_READ_URL) {
        console.error("VITE_GOOGLE_SHEETS_READ_URL is not defined. Cannot fetch client list.");
        throw new Error("Application is not configured to fetch client data.");
    }
    
    try {
        const response = await fetch(GOOGLE_SHEETS_READ_URL);

        if (!response.ok) {
            throw new Error(`Failed to fetch clients. Server responded with status ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
             throw new Error(`API returned an error: ${data.error}`);
        }

        // Ensure data is an array before returning
        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error("Error during fetchClients:", error);
        throw error; // Re-throw the error to be caught by the calling component
    }
};
