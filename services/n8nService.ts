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
        
        const rawData = await response.json();

        if (!Array.isArray(rawData)) {
            console.error("Data from n8n is not an array as expected:", rawData);
            return [];
        }

        // Map the raw data from Google Sheets/n8n to the app's SaleData structure.
        const mappedClients: SaleData[] = rawData.map((rawClient: any) => {
            // Handle potential typo in the column name from Google Sheets ("Sisteme" vs "Sistema").
            const paymentSystemValue = (rawClient['Sisteme de pago'] || rawClient['Sistema de pago'] || PaymentSystem.MENSAL).toUpperCase();

            return {
                id: String(rawClient.row_number || Date.now() + Math.random()), // Use row_number as a stable ID
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
                
                vendedor: rawClient['Vendedor'] || '', // Assuming 'Vendedor' might be a column
                guarantor: rawClient['Garante'] || '',
                notes: rawClient['Observaciones'] || '',
            };
        });

        return mappedClients;

    } catch (error) {
        console.error("Error fetching or parsing clients from n8n:", error);
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
