
import { SaleData } from '../types';

/**
 * Fetches the list of all clients from the n8n webhook. This function is robust
 * and can handle several common n8n response formats.
 *
 * @returns {Promise<SaleData[]>} - A promise that resolves to an array of client data.
 */
export const fetchClientsFromN8n = async (): Promise<SaleData[]> => {
    const GET_CLIENTS_URL = import.meta.env.VITE_N8N_GET_CLIENTS_URL;

    if (!GET_CLIENTS_URL) {
        console.warn("VITE_N8N_GET_CLIENTS_URL is not defined. Cannot fetch clients.");
        return [];
    }

    try {
        const response = await fetch(GET_CLIENTS_URL, { method: 'GET', mode: 'cors' });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to fetch clients from n8n: ${response.status} ${response.statusText}. Body: ${errorBody}`);
        }
        
        const textBody = await response.text();
        if (!textBody) {
            return []; // Handle cases where n8n returns an empty body.
        }

        const data = JSON.parse(textBody);
        
        let clientList: any[] = [];

        // Case 1: The response is already the array of clients. `[{}, {}]`
        if (Array.isArray(data)) {
            clientList = data;
        } 
        // Case 2: The response is an object containing the array of clients. `{"data": [{}, {}]}`
        else if (typeof data === 'object' && data !== null) {
            // Find the first property that is an array and assume it's our list.
            const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
            if (arrayKey) {
                clientList = data[arrayKey];
            }
        }

        // Now that we (hopefully) have the list, check for the common n8n `item.json` wrapper.
        // This handles the `[{ json: {...} }, { json: {...} }]` format.
        if (clientList.length > 0 && clientList[0] && clientList[0].hasOwnProperty('json')) {
            // Extract the `json` property from each item.
            return clientList.map(item => item.json).filter(Boolean) as SaleData[];
        }

        // If no special format is detected, return the list as is.
        return clientList as SaleData[];

    } catch (error) {
        console.error("Error fetching or parsing clients from n8n:", error);
        throw error; // Re-throw the error to be caught by the calling function in App.tsx
    }
};


/**
 * Sends the complete form data, including files, to the primary n8n webhook.
 * This function constructs a `multipart/form-data` payload where each piece of data
 * is a separate part, and each file is a separate binary part. This is a common
 * format that is easily parsable by services like n8n.
 *
 * @param {SaleData} data - The client and sale data object, including ID for edits.
 * @param {{ [key: string]: File }} files - A map of field names to File objects.
 * @returns {Promise<boolean>} - True for success, false for failure.
 */
export const sendFormDataToN8n = async (
    data: SaleData, 
    files: { [key: string]: File }
): Promise<boolean> => {
    const N8N_FORM_URL = import.meta.env.VITE_N8N_FORM_WORKFLOW_URL;

    if (!N8N_FORM_URL) {
        console.warn("VITE_N8N_FORM_WORKFLOW_URL not set. Skipping form submission to n8n.");
        return true; // Don't block the process if this one isn't configured
    }

    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (!Object.prototype.hasOwnProperty.call(files, key)) {
            if (value === null || value === undefined) {
                formData.append(key, '');
            } else {
                formData.append(key, String(value));
            }
        }
    });

    for (const key in files) {
        if (files[key]) {
            formData.append(key, files[key], files[key].name);
        }
    }

    try {
        const response = await fetch(N8N_FORM_URL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`n8n form workflow returned an error: ${response.status} ${response.statusText}. Response: ${errorBody}`);
            return false;
        }

        console.log("Form data successfully sent to n8n.");
        return true;

    } catch (error) {
        console.error("Error sending form data to n8n:", error);
        if (error instanceof TypeError) {
             console.error("A network error occurred. Check the connection and CORS settings for the n8n webhook.");
        }
        return false;
    }
};

/**
 * Sends just the JSON data to the secondary n8n workflow for report generation.
 *
 * @param {SaleData} data - The client and sale data, including ID for edits.
 * @returns {Promise<boolean>} - True for success, false for failure.
 */
export const sendReportDataToN8n = async (data: SaleData): Promise<boolean> => {
     const N8N_REPORT_URL = import.meta.env.VITE_N8N_REPORT_WORKFLOW_URL;

    if (!N8N_REPORT_URL) {
        console.warn("VITE_N8N_REPORT_WORKFLOW_URL not set. Skipping report submission to n8n.");
        return true; // Don't block the process if this one isn't configured
    }
    
    try {
        const response = await fetch(N8N_REPORT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            console.error(`n8n report workflow returned an error: ${response.status} ${response.statusText}`);
            return false;
        }
        
        console.log("Report data successfully sent to n8n.");
        return true;

    } catch (error) {
        console.error("Error sending report data to n8n:", error);
        return false;
    }
};
