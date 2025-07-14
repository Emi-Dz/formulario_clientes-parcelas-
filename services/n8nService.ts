
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
    // Create a mutable copy of the data object. We will remove file-related
    // keys from this object before stringifying it.
    const jsonData = { ...data };

    // Iterate over the file objects. For each file:
    // 1. Add it to the FormData object for binary upload.
    // 2. Remove its corresponding key from the jsonData object. This prevents
    //    the filename string from being sent inside the main JSON payload.
    for (const key in files) {
        if (Object.prototype.hasOwnProperty.call(files, key) && files[key]) {
            // 1. Add the actual file to FormData for binary upload.
            formData.append(key, files[key], files[key].name);
            
            // 2. Explicitly delete the property from the object that will be stringified.
            delete jsonData[key as keyof typeof jsonData];
        }
    }

    // Now, `jsonData` is clean of any properties that represent files.
    // Stringify it and append it to the FormData under the key "data".
    formData.append('data', JSON.stringify(jsonData));

    try {
        const response = await fetch(N8N_FORM_URL, {
            method: 'POST',
            body: formData, // The browser will automatically set the Content-Type to multipart/form-data
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
