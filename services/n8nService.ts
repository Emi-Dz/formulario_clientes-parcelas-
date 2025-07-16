
import { SaleData, PaymentSystem } from '../types';

/**
 * Fetches the list of all clients from the n8n webhook and maps the raw data
 * to the application's internal data structure (SaleData).
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
        
        const responseBody = await response.json();
        let clientListRaw: any[] = [];

        // Intelligently find the array of clients within the response from n8n.
        if (Array.isArray(responseBody)) {
            clientListRaw = responseBody;
        } else if (typeof responseBody === 'object' && responseBody !== null) {
            // Find the first property in the object that is an array.
            const potentialArray = Object.values(responseBody).find(Array.isArray);
            if (potentialArray) {
                clientListRaw = potentialArray;
            }
        }
        
        // Handle a common n8n pattern where each item is wrapped, e.g., [{json: {...}}]
        if (clientListRaw.length > 0 && clientListRaw[0] && clientListRaw[0].json) {
           clientListRaw = clientListRaw.map((item: any) => item.json);
        }

        if (clientListRaw.length === 0 && (typeof responseBody === 'object' && responseBody !== null)) {
             console.warn("Could not find a client array in the response from n8n:", responseBody);
        }

        // Map the raw data from Google Sheets/n8n to the app's SaleData structure.
        const mappedClients: SaleData[] = clientListRaw.map((rawClient: any) => {
             if (!rawClient || typeof rawClient !== 'object') return null;
            // Handle potential typo in the column name from Google Sheets ("Sisteme" vs "Sistema").
            const paymentSystemValue = (rawClient['Sisteme de pago'] || rawClient['Sistema de pago'] || PaymentSystem.MENSAL).toUpperCase();

            return {
                id: String(rawClient.row_number || `temp_${Date.now()}_${Math.random()}`), // Use row_number as a stable ID
                timestamp: rawClient['Marca temporal'] || '',
                clientFullName: rawClient['Nombre y Apellido'] || '',
                clientCpf: rawClient['CPF Cliente'] || '',
                // Use the date part of the timestamp for purchase date, or default to today.
                purchaseDate: rawClient['Marca temporal']?.split(',')[0] || new Date().toISOString().split('T')[0],
                phone: String(rawClient['Telefono Cliente'] || ''),
                product: rawClient['Productos'] || '',
                
                totalProductPrice: Number(rawClient['Precio Total'] || 0),
                downPayment: Number(rawClient['Anticipo'] || 0),
                installments: Number(rawClient['Cuotas'] || 1),
                installmentPrice: Number(rawClient['Precio por Cuota'] || 0),

                reference1Name: rawClient['Referencia 1'] || '',
                reference1Relationship: rawClient['Parentesco / Telefono REF 1'] || '',
                reference2Name: rawClient['Referencia 2'] || '',
                reference2Relationship: rawClient['Parentesco / Telefono REF 2'] || '',
                
                language: rawClient['Idiomas'] || '',
                storeName: rawClient['Nombre Tienda'] || '',
                
                workLocation: rawClient['Ubicacion Trabajo'] || '',
                workAddress: rawClient['Direccion trabajo'] || '',
                homeLocation: rawClient['Ubicacion Casa'] || '',
                homeAddress: rawClient['Dirección Casa'] || '',
                
                photoStoreFileName: rawClient['Foto Tienda'] || '',
                photoContractFrontFileName: rawClient['Foto Contrato FRENTE'] || '',
                photoContractBackFileName: rawClient['Foto Contrato REVERSO'] || '',
                photoIdFrontFileName: rawClient['Foto RG FRENTE'] || '',
                photoIdBackFileName: rawClient['Foto RG REVERSO'] || '',
                photoCpfFileName: rawClient['Foto CPF'] || '',
                photoHomeFileName: rawClient['Foto Casa'] || '',
                photoPhoneCodeFileName: rawClient['Foto Codigo Telefono'] || '',
                photoInstagramFileName: rawClient['Foto Perfil Instagram'] || '',
                
                clientType: rawClient['Tipo cliente'] || '',
                paymentSystem: paymentSystemValue as PaymentSystem,
                paymentStartDate: rawClient['Fecha inicio de pago'] || '',
                
                vendedor: rawClient['Vendedor'] || '',
                guarantor: rawClient['Garante'] || '',
                notes: rawClient['Observaciones'] || '',
            };
        }).filter((client): client is SaleData => client !== null); // Filter out any nulls from failed mappings

        return mappedClients;

    } catch (error) {
        console.error("Error fetching or parsing clients from n8n:", error);
        throw error;
    }
};


/**
 * Sends the complete form data, including files, to the primary n8n webhook.
 * This function constructs a `multipart/form-data` payload. It intelligently sends
 * either the file object (for new uploads) or the filename string (for existing files),
 * but not both for the same field, to prevent server-side ambiguity that could cause hangs.
 *
 * @param {SaleData} data - The client and sale data object, including ID for edits.
 * @param {{ [key: string]: File }} files - A map of field names to File objects for new uploads.
 * @returns {Promise<boolean>} - True for success, false for failure.
 */
export const sendFormDataToN8n = async (
    data: SaleData, 
    files: { [key: string]: File }
): Promise<boolean> => {
    const N8N_FORM_URL = import.meta.env.VITE_N8N_FORM_WORKFLOW_URL;

    if (!N8N_FORM_URL) {
        console.warn("VITE_N8N_FORM_WORKFLOW_URL not set. Skipping form submission to n8n.");
        return true;
    }

    const formData = new FormData();

    // Append all text-based data fields from the 'data' object.
    Object.entries(data).forEach(([key, value]) => {
        // The client ID is sent as 'row_number' later, so we skip it here to avoid duplication
        // and potential confusion in the n8n workflow.
        if (key === 'id') {
            return;
        }

        // If a new file is being uploaded for this key, we skip appending the text version 
        // of its filename. The file (with its name) will be appended in the next loop.
        if (files[key]) {
            return;
        }
        
        // Append the text value, ensuring null/undefined becomes an empty string.
        if (value === null || value === undefined) {
            formData.append(key, '');
        } else {
            formData.append(key, String(value));
        }
    });

    // Append the actual file data for any new files.
    Object.entries(files).forEach(([key, file]) => {
        formData.append(key, file, file.name);
    });
    
    // For updates, send the 'row_number' so the n8n workflow knows which record to modify.
    if (data.id && !data.id.startsWith('temp_')) {
        formData.append('row_number', data.id);
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
 * Sends a request to an n8n webhook to delete a client.
 *
 * @param {string} clientId - The ID of the client to delete (corresponds to the row_number).
 * @returns {Promise<boolean>} - True for success, false for failure.
 */
export const deleteClientInN8n = async (clientId: string): Promise<boolean> => {
    const DELETE_URL = import.meta.env.VITE_N8N_DELETE_CLIENT_URL;
    if (!DELETE_URL) {
        console.warn("VITE_N8N_DELETE_CLIENT_URL is not defined. Cannot delete client.");
        return false;
    }

    try {
        // The payload sent to n8n for deletion. It identifies the client by their row_number.
        const payload = {
            row_number: clientId
        };

        const response = await fetch(DELETE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`n8n delete workflow returned an error: ${response.status} ${response.statusText}. Response: ${errorBody}`);
            return false;
        }

        console.log(`Client ${clientId} successfully deleted via n8n.`);
        return true;

    } catch (error) {
        console.error("Error sending delete request to n8n:", error);
        return false;
    }
};
