import { SaleData } from '../types';

// A definitive list of all keys that represent file uploads.
// This is used to cleanly separate file data from JSON data.
const FILE_KEYS: (keyof Omit<SaleData, 'id'>)[] = [
    'photoStoreFileName',
    'photoContractFrontFileName',
    'photoContractBackFileName',
    'photoIdFrontFileName',
    'photoIdBackFileName',
    'photoCpfFileName',
    'photoHomeFileName',
    'photoPhoneCodeFileName',
    'photoInstagramFileName'
];

/**
 * Sends the complete form data, including files, to the primary n8n webhook.
 * This function is carefully designed to prevent ambiguity for the n8n webhook.
 * It creates a multipart/form-data payload with two distinct types of parts:
 * 1. A single part named 'data' containing a JSON string of all non-file form fields.
 * 2. Multiple parts, one for each uploaded file, where the part name is the field name
 *    and the content is the binary file data.
 *
 * @param {Omit<SaleData, 'id'>} data - The client and sale data, which may contain filename strings.
 * @param {{ [key: string]: File }} files - A map of field names to actual File objects.
 * @returns {Promise<boolean>} - True for success, false for failure.
 */
export const sendFormDataToN8n = async (
    data: Omit<SaleData, 'id'>,
    files: { [key: string]: File }
): Promise<boolean> => {
    const N8N_FORM_URL = import.meta.env.VITE_N8N_FORM_WORKFLOW_URL;

    if (!N8N_FORM_URL) {
        console.warn("VITE_N8N_FORM_WORKFLOW_URL not set. Skipping form submission to n8n.");
        return true; // Don't block the process if this one isn't configured
    }

    const formData = new FormData();
    
    // Create a mutable copy of the data object to be sent as JSON.
    // We will clean this object by removing file-related keys.
    const jsonData: { [key: string]: any } = { ...data };

    // 1. Iterate over the actual file objects provided.
    for (const fileKey in files) {
        // Check that the key belongs to the object and the file is valid.
        if (Object.prototype.hasOwnProperty.call(files, fileKey) && files[fileKey]) {
            // Append the actual file (binary data) to the FormData.
            formData.append(fileKey, files[fileKey], files[fileKey].name);
            
            // Now, remove this key from the JSON data object because its value
            // is being sent as a binary part, not as a string in the JSON.
            // This is the crucial step to avoid ambiguity for n8n.
            delete jsonData[fileKey];
        }
    }

    // 2. Stringify the cleaned JSON data and append it as a single field named 'data'.
    formData.append('data', JSON.stringify(jsonData));


    try {
        const response = await fetch(N8N_FORM_URL, {
            method: 'POST',
            body: formData, // The browser will automatically set the Content-Type to multipart/form-data
        });

        if (!response.ok) {
            console.error(`n8n form workflow returned an error: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error(`n8n error response: ${errorBody}`);
            return false;
        }

        console.log("Form data successfully sent to n8n.");
        return true;
    } catch (error) {
        console.error("Error sending form data to n8n:", error);
        return false;
    }
};

/**
 * Sends just the JSON data to the secondary n8n workflow for report generation.
 *
 * @param {Omit<SaleData, 'id'>} data - The client and sale data.
 * @returns {Promise<boolean>} - True for success, false for failure.
 */
export const sendReportDataToN8n = async (data: Omit<SaleData, 'id'>): Promise<boolean> => {
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
