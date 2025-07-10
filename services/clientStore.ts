import { SaleData } from '../types';

const CLIENTS_STORAGE_KEY = 'salesClientsData_v2'; // Bumped version to avoid conflicts with old data structure

export const getClients = (): SaleData[] => {
    try {
        const data = localStorage.getItem(CLIENTS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading clients from localStorage, possibly due to corrupted data. Clearing it.", error);
        localStorage.removeItem(CLIENTS_STORAGE_KEY);
        return [];
    }
};

export const saveClients = (clients: SaleData[]): void => {
    try {
        localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
    } catch (error) {
        console.error("Error saving clients to localStorage", error);
    }
};

export const addClient = (client: Omit<SaleData, 'id'>): SaleData => {
    const clients = getClients();
    const newClient: SaleData = {
        ...client,
        id: crypto.randomUUID(), // Generate a unique ID for the new client
    };
    const updatedClients = [...clients, newClient];
    saveClients(updatedClients);
    return newClient;
};

export const updateClient = (updatedClient: SaleData): SaleData[] => {
    const clients = getClients();
    const clientIndex = clients.findIndex(c => c.id === updatedClient.id);

    if (clientIndex > -1) {
        const updatedClients = [...clients];
        updatedClients[clientIndex] = updatedClient;
        saveClients(updatedClients);
        return updatedClients;
    }
    // This should not happen in normal flow, but handle defensively
    return clients;
};

export const getClient = (id: string): SaleData | undefined => {
    return getClients().find(c => c.id === id);
};
