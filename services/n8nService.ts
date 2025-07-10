import { SaleData } from '../types';

/**
 * Sends the complete form data, including files, to the primary n8n webhook.
 *
 * @param {Omit<SaleData, 'id'>} data - The client and sale data.
 * @param {{ [key: string]: File }} files - A map of field names to File objects.
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

    // Append all text/numeric data as a single JSON string under a 'data' key
    formData.append('data', JSON.stringify(data));

    // Append each file
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
            console.error(`n8n form workflow returned an error: ${response.status} ${response.statusText}`);
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
