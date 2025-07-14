/**
 * Sends sale data, including files, to an n8n webhook.
 * It constructs a FormData object where client data is a JSON string under the key 'data',
 * and files are appended as binary data. This function is misnamed but modified as requested.
 *
 * @param {SaleData} data - The sale data to be sent, which can include File objects.
 * @returns {Promise<boolean>} - True if the data was sent successfully, false otherwise.
 */
export const sendToGoogleSheets = async (data: SaleData): Promise<boolean> => {
    const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;

    if (!N8N_WEBHOOK_URL) {
        console.warn("--- n8n Webhook Integration ---");
        console.warn("VITE_N8N_WEBHOOK_URL is not defined. Skipping webhook submission.");
        // This is not a failure if not configured, allowing local storage and Excel to still work.
        return true;
    }

    const formData = new FormData();
    const clientData: { [key: string]: any } = {};

    const fileKeys: (keyof SaleData)[] = [
        'photoStoreFileName', 'photoContractFrontFileName', 'photoContractBackFileName',
        'photoIdFrontFileName', 'photoIdBackFileName', 'photoCpfFileName', 'photoHomeFileName',
        'photoPhoneCodeFileName', 'photoInstagramFileName'
    ];

    // Separate files from other data
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const typedKey = key as keyof SaleData;
            const value = (data as any)[typedKey];

            if (fileKeys.includes(typedKey) && value instanceof File) {
                // If it's a file, append it to FormData
                formData.append(typedKey, value, value.name);
                // Also add the filename to the JSON payload for reference
                clientData[key] = value.name;
            } else {
                // Otherwise, add it to the JSON payload
                clientData[key] = value;
            }
        }
    }
    
    formData.append('data', JSON.stringify(clientData));

    try {
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            body: formData,
            // Note: Do not set the 'Content-Type' header manually for FormData.
            // The browser will automatically set it to 'multipart/form-data'
            // with the correct boundary.
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`n8n Webhook Error: Request failed with status ${response.status}. Response: ${errorBody}`);
            return false;
        }

        console.log('Data successfully sent to n8n webhook.');
        return true;

    } catch (error) {
        console.error('Error sending data to webhook:', error);
        if (error instanceof TypeError) {
            console.error("A network error occurred. This could be a connection issue or a CORS problem.");
        }
        return false;
    }
};
