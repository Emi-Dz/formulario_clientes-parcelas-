import { SaleData } from '../types';

/**
 * Fetches the list of all clients from the n8n webhook.
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
        if (!textBody) { // Handle empty response body
            return [];
        }

        const data = JSON.parse(textBody);
        
        // n8n can return data in several formats.
        // 1. A direct array of objects: `[{...}, {...}]`
        // 2. An array of items, where each item has a `json` property: `[{ json: {...} }, { json: {...} }]`
        // This logic handles both common n8n GET webhook response formats gracefully.
        if (Array.isArray(data)) {
            // If the first element has a 'json' property, we assume it's the n8n wrapper format.
            if (data.length > 0 && data[0].hasOwnProperty('json')) {
                // Extracts the actual client data from each item in the array.
                return data.map(item => item.json) as SaleData[];
            }
            // Otherwise, we assume it's already a direct array of client data.
            return data as SaleData[];
        }

        // If data is not an array, it's an unexpected format. Return empty.
        return [];

    } catch (error) {
        console.error("Error fetching clients from n8n:", error);
        throw error;
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

    // Append each non-file data field as a separate part in the multipart form.
    Object.entries(data).forEach(([key, value]) => {
        // We check if the key exists in the `files` object. If it does, it's a file field,
        // and we should not append its string value (the filename). The actual file binary
        // will be appended in the next step.
        if (!Object.prototype.hasOwnProperty.call(files, key)) {
            if (value === null || value === undefined) {
                formData.append(key, '');
            } else {
                // FormData automatically converts values to strings, which is standard.
                formData.append(key, String(value));
            }
        }
    });

    // Append each file as a binary part.
    // The `key` (e.g., 'photoStoreFileName') will be the field name in the multipart form.
    for (const key in files) {
        if (files[key]) {
            formData.append(key, files[key], files[key].name);
        }
    }

    try {
        const response = await fetch(N8N_FORM_URL, {
            method: 'POST',
            body: formData,
            // IMPORTANT: Do not set the 'Content-Type' header manually when using FormData.
            // The browser will automatically set it to 'multipart/form-data' and include
            // the necessary boundary string.
        });

        if (!response.ok) {
            // Try to get more detailed error from the response body for debugging
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
