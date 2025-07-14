import { SaleData } from '../types';

let clients: Map<string, SaleData> = new Map();

/**
 * Caches the list of clients in memory for quick access.
 * @param clientList - The array of clients fetched from the backend.
 */
export const setClients = (clientList: SaleData[]): void => {
    clients = new Map(clientList.map(client => [client.id, client]));
};

/**
 * Retrieves a single client by their ID from the in-memory cache.
 * @param id - The ID of the client to retrieve.
 * @returns The client data or undefined if not found.
 */
export const getClient = (id: string): SaleData | undefined => {
    return clients.get(id);
};

