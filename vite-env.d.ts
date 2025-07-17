// This file is used to provide type definitions for Vite's `import.meta.env` feature.
// By defining these interfaces, we can get TypeScript type checking and autocompletion
// for our environment variables.

interface ImportMetaEnv {
  /**
   * The webhook URL to fetch all users for authentication.
   */
  readonly VITE_N8N_GET_USERS_URL?: string;
  
  /**
   * The webhook URL for the n8n workflow that handles UPDATING form data and file uploads.
   * This is used for modifications.
   */
  readonly VITE_N8N_FORM_WORKFLOW_URL?: string;

  /**
   * The webhook URL for the n8n workflow that handles CREATING a new purchase.
   * This is used for new submissions.
   */
  readonly VITE_N8N_NEW_PURCHASE_WORKFLOW_URL?: string;

  /**
   * The webhook URL to fetch all clients from n8n.
   * Should now include the `clientStatus` field.
   */
  readonly VITE_N8N_GET_CLIENTS_URL?: string;
  
  /**
   * The webhook URL to delete a client in n8n.
   */
  readonly VITE_N8N_DELETE_CLIENT_URL?: string;

  /**
   * The webhook URL to update a client's status (e.g., mark as 'not apt').
   */
  readonly VITE_N8N_UPDATE_CLIENT_STATUS_URL?: string;

  /**
   * (Legacy) The URL for the read-only Google Apps Script that fetches the client list.
   */
  readonly VITE_GOOGLE_SHEETS_READ_URL?: string;

  /**
   * (Legacy) The URL for the Google Apps Script to write data directly to the sheet.
   * This might be deprecated in favor of n8n workflows.
   */
  readonly VITE_GOOGLE_APPS_SCRIPT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
