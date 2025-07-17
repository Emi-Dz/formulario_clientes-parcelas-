
import { SaleData, PaymentSystem, UserWithPassword } from '../types';

/**
 * Fetches the list of all users from the n8n webhook for authentication.
 *
 * @returns {Promise<UserWithPassword[]>} A promise that resolves to an array of users.
 */
export const fetchUsers = async (): Promise<UserWithPassword[]> => {
    const GET_USERS_URL = import.meta.env.VITE_N8N_GET_USERS_URL;

    if (!GET_USERS_URL) {
        console.error("Configuration error: VITE_N8N_GET_USERS_URL is not defined in your .env file.");
        throw new Error("Configuration error: VITE_N8N_GET_USERS_URL is not defined.");
    }

    console.log(`[n8nService] Attempting to fetch users from: ${GET_USERS_URL}`);

    try {
        const response = await fetch(GET_USERS_URL, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[n8nService] Failed to fetch users. Status: ${response.status}. URL: ${GET_USERS_URL}. Response Body:`, errorBody);
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
            role: (rawUser.usuario === 'adminparcelas' || rawUser.role === 'admin') ? 'admin' : 'vendedor',
        }));

    } catch (error) {
        console.error(`[n8nService] Error during fetch or parsing for users. URL: ${GET_USERS_URL}. Error:`, error);
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
        console.error("Configuration error: VITE_N8N_GET_CLIENTS_URL is not defined in your .env file.");
        return [];
    }
    
    console.log(`[n8nService] Attempting to fetch clients from: ${GET_CLIENTS_URL}`);

    try {
        const response = await fetch(GET_CLIENTS_URL, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[n8nService] Failed to fetch clients. Status: ${response.status}. URL: ${GET_CLIENTS_URL}. Response Body:`, errorBody);
            throw new Error(`Failed to fetch clients from n8n: ${response.status} ${response.statusText}.`);
        }
        
        const responseText = await response.text();
        if (!responseText) {
            console.log("[n8nService] Fetched clients successfully, but response body was empty. Returning empty array.");
            return [];
        }
        const responseBody = JSON.parse(responseText);

        let clientListRaw: any[] | null = null;

        // Try to find the array of clients in various common n8n response structures.
        if (Array.isArray(responseBody)) {
            clientListRaw = responseBody;
        } else if (typeof responseBody === 'object' && responseBody !== null) {
            if (Array.isArray(responseBody.data)) {
                clientListRaw = responseBody.data;
            } else if (Array.isArray(responseBody.items)) {
                clientListRaw = responseBody.items;
            } else if (Array.isArray(responseBody.results)) {
                clientListRaw = responseBody.results;
            } else {
                const potentialArray = Object.values(responseBody).find(val => Array.isArray(val));
                if (potentialArray && Array.isArray(potentialArray)) {
                    clientListRaw = potentialArray;
                }
            }
        }

        if (!Array.isArray(clientListRaw)) {
            console.warn("[n8nService] Could not find a client array in the response from n8n. Response body:", responseBody);
            return [];
        }

        if (clientListRaw.length > 0 && clientListRaw[0] && typeof clientListRaw[0] === 'object' && clientListRaw[0].json) {
           clientListRaw = clientListRaw.map((item: any) => item.json);
        }

        const mappedClients: SaleData[] = clientListRaw.map((rawClient: any) => {
             if (!rawClient || typeof rawClient !== 'object') return null;
            const paymentSystemValue = (rawClient['Sisteme de pago'] || rawClient['Sistema de pago'] || PaymentSystem.MENSAL).toUpperCase();

            return {
                id: String(rawClient.row_number || `temp_${Date.now()}_${Math.random()}`),
                timestamp: rawClient['Marca temporal'] || '',
                clientFullName: rawClient['Nombre y Apellido'] || '',
                clientCpf: rawClient['CPF Cliente'] || '',
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
        }).filter((client): client is SaleData => client !== null);

        return mappedClients;

    } catch (error) {
        console.error(`[n8nService] Error fetching or parsing clients from n8n. URL: ${GET_CLIENTS_URL}. Error:`, error);
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
        console.error("Configuration error: VITE_N8N_FORM_WORKFLOW_URL not set in .env file.");
        throw new Error("Configuration error: VITE_N8N_FORM_WORKFLOW_URL is not defined.");
    }
    
    console.log(`[n8nService] Attempting to POST form data to: ${N8N_FORM_URL}`);
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
         if (value === null || value === undefined) {
            formData.append(key, '');
        } else {
            formData.append(key, String(value));
        }
    });
    
    Object.entries(files).forEach(([key, file]) => {
        if(file) {
            formData.set(key, file, file.name);
        }
    });
    
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
            console.error(`[n8nService] Form submission failed. Status: ${response.status}. URL: ${N8N_FORM_URL}. Response Body:`, errorBody);
            return false;
        }

        console.log("[n8nService] Form data successfully sent to n8n.");
        return true;

    } catch (error) {
        console.error(`[n8nService] Error sending form data to n8n. URL: ${N8N_FORM_URL}. Error:`, error);
        if (error instanceof TypeError) {
             console.error("[n8nService] A network error occurred. Check the connection and CORS settings for the n8n webhook.");
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
        console.error("Configuration error: VITE_N8N_DELETE_CLIENT_URL is not defined in your .env file.");
        return false;
    }

    console.log(`[n8nService] Attempting to POST delete request for client ID ${clientId} to: ${DELETE_URL}`);

    try {
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
            console.error(`[n8nService] Delete request failed. Status: ${response.status}. URL: ${DELETE_URL}. Response Body:`, errorBody);
            return false;
        }

        console.log(`[n8nService] Client ${clientId} successfully deleted via n8n.`);
        return true;

    } catch (error) {
        console.error(`[n8nService] Error sending delete request to n8n. URL: ${DELETE_URL}. Error:`, error);
        return false;
    }
};
