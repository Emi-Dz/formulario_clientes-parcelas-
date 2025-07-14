// This file is used to provide type definitions for Vite's `import.meta.env` feature.
// By defining these interfaces, we can get TypeScript type checking and autocompletion
// for our environment variables.

interface ImportMetaEnv {
  /**
   * The URL for the Google Apps Script web app used for the Google Sheets integration.
   * This is an optional variable. If not provided, the Google Sheets submission will be skipped.
   */
  readonly VITE_GOOGLE_APPS_SCRIPT_URL?: string;

  /**
   * The URL for the n8n webhook to receive form submissions.
   * This is optional. If not provided, the webhook submission will be skipped.
   */
  readonly VITE_N8N_WEBHOOK_URL?: string;

  // You can add other environment variables here.
  // readonly VITE_SOME_OTHER_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
