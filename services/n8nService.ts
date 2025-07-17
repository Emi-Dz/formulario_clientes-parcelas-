
import { SaleData, PaymentSystem, UserWithPassword } from '../types';

/**
 * Fetches the list of all users from the n8n webhook for authentication.
 *
 * @returns {Promise<UserWithPassword[]>} A promise that resolves to an array of users.
 */
export const fetchUsers = async (): Promise<UserWithPassword[]> => {
    const GET_USERS_URL = import.meta.env.VITE_N8N_GET_USERS_URL;

    if (!GET_USERS_URL) {
        throw new Error("Configuration error: VITE_N8N_GET_USERS_URL is not defined.");
    }

    try {
        const response = await fetch(GET_USERS_URL, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Failed to fetch users from n8n: ${response.status} ${response.statusText}`);
        }
        
        const responseBody = await response.json();
        
        let userListRaw: any[] = [];
        if (Array.isArray(responseBody)) {
           userListRaw = responseBody;
        } else if (responseBody && Array.isArray(responseBody.data)) {
           userListRaw = responseBody.data;
        } else if (responseBody && Array.isArray(responseBody.items)) {
           userListRaw = responseBody.items;
        }

        if (userListRaw.length > 0 && userListRaw[0].json) {
            userListRaw = userListRaw.map(item => item.json);
        }

        return userListRaw.map((rawUser: any): UserWithPassword => ({
            id: String(rawUser['row number'] || rawUser.id),
            username: rawUser.usuario || '',
            password: rawUser.contraseña || '',
            // As per user request, 'joelito' is the admin user.
            role: (rawUser.usuario === 'joelito' || rawUser.role === 'admin') ? 'admin' : 'vendedor',
        }));

    } catch (error) {
        console.error("Error fetching or parsing users from n8n:", error);
        throw error;
    }
};

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
        const response = await fetch(GET_CLIENTS_URL, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Failed to fetch clients from n8n: ${response.status} ${response.statusText}. Body: ${errorBody}`);
        }
        
        const responseText = await response.text();
        if (!responseText) {
            // Webhook returned 200 OK but with an empty body.
            // This can happen if there are no clients. Treat as an empty list.
            return [];
        }
        const responseBody = JSON.parse(responseText);

        let clientListRaw: any[] | null = null;

        // Try to find the array of clients in various common n8n response structures.
        if (Array.isArray(responseBody)) {
            // Case 1: The response body is the array of clients.
            // This could be direct [ {client1}, {client2} ] or wrapped [ {json: client1}, {json: client2} ]
            clientListRaw = responseBody;
        } else if (typeof responseBody === 'object' && responseBody !== null) {
            // Case 2: The response is an object, look for a property containing the array.
            if (Array.isArray(responseBody.data)) {
                // e.g., { "data": [...] }
                clientListRaw = responseBody.data;
            } else if (Array.isArray(responseBody.items)) {
                // e.g., { "items": [...] }
                clientListRaw = responseBody.items;
            } else if (Array.isArray(responseBody.results)) {
                // e.g., { "results": [...] }
                clientListRaw = responseBody.results;
            } else {
                // Fallback: find the first property that is an array.
                const potentialArray = Object.values(responseBody).find(val => Array.isArray(val));
                if (potentialArray && Array.isArray(potentialArray)) {
                    clientListRaw = potentialArray;
                }
            }
        }

        // If no array was found, warn and return empty.
        if (!Array.isArray(clientListRaw)) {
            console.warn("Could not find a client array in the response from n8n. Response body:", responseBody);
            return [];
        }

        // n8n often wraps each item's data in a `json` property.
        // We check the first item to see if this unwrapping is needed.
        if (clientListRaw.length > 0 && clientListRaw[0] && typeof clientListRaw[0] === 'object' && clientListRaw[0].json) {
           clientListRaw = clientListRaw.map((item: any) => item.json);
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
 * This function constructs a `multipart/form-data` payload. It's carefully
 * constructed to preserve existing file names during an edit, while uploading
 * new files.
 *
 * @param {SaleData} data - The client and sale data object, including ID for edits.
 * @param {{ [key: string]: File }} files - A map of field names to newly uploaded File objects.
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

    // 1. Append all data from the form state as string values.
    // This includes existing filenames and the filenames of new files.
    Object.entries(data).forEach(([key, value]) => {
         if (value === null || value === undefined) {
            formData.append(key, '');
        } else {
            formData.append(key, String(value));
        }
    });
    
    // 2. For each newly uploaded file, overwrite the string value in FormData
    // with the actual file object. This ensures that for a given field (e.g., 'photoStoreFileName'),
    // we send EITHER the old filename (if unchanged) OR the new file object, but never both.
    Object.entries(files).forEach(([key, file]) => {
        if(file) {
            formData.set(key, file, file.name);
        }
    });
    
    // For updates, send the row_number so the n8n workflow knows which record to modify.
    // The client ID is the row_number from the Google Sheet.
    if (data.id && !data.id.startsWith('temp_')) {
        formData.set('row_number', data.id);
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
