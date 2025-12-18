// This service handles the Google API and Identity Services initialization and authentication flow.

// TypeScript interfaces for Google's global objects (gapi, google)
// This avoids needing to install large @types/gapi packages for a few functions.
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface ITokenClient {
    requestAccessToken: (overrideConfig: { prompt: string }) => void;
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: ITokenClient;

const gapiLoadPromise = new Promise<void>((resolve, reject) => {
    const timeout = 5000;
    const interval = 100;
    let elapsedTime = 0;

    const checkGapi = setInterval(() => {
        if (window.gapi && window.gapi.load) {
            clearInterval(checkGapi);
            window.gapi.load('client', {
                callback() {
                    const API_KEY = process.env.API_KEY || '';
                    if (!API_KEY) {
                       reject(new Error("API_KEY is not configured."));
                       return;
                    }
                    window.gapi.client.init({
                        apiKey: API_KEY,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                    }).then(() => {
                        resolve();
                    }, (error: any) => {
                        console.error(
                            "--- Google Drive API Initialization Error ---\n" +
                            "This error often indicates a problem with your Google Cloud project configuration:\n" +
                            "1. API Key Validity: Ensure your API_KEY is correct and has not expired.\n" +
                            "2. API Enabled: Make sure the 'Google Drive API' is enabled in your Google Cloud Console for this project.\n" +
                            "3. API Restrictions: Check if your API key has HTTP referer or IP address restrictions that might block access from this environment.\n\n" +
                            "Original Error:", error
                        );
                        const errorDetail = error?.result?.error?.message || 'API discovery response missing required fields. Check your Google Cloud project configuration.';
                        reject(new Error(errorDetail));
                    });
                },
                onerror: () => reject(new Error('GAPI client library failed to load.')),
                timeout: 5000,
                ontimeout: () => reject(new Error("GAPI client library load timed out.")),
            });
        } else {
            elapsedTime += interval;
            if (elapsedTime >= timeout) {
                clearInterval(checkGapi);
                reject(new Error("GAPI library failed to load in time."));
            }
        }
    }, interval);
});

const gisLoadPromise = new Promise<void>((resolve, reject) => {
    const timeout = 5000;
    const interval = 100;
    let elapsedTime = 0;

    const checkGis = setInterval(() => {
        if (window.google && window.google.accounts) {
            clearInterval(checkGis);
            resolve();
        } else {
            elapsedTime += interval;
            if (elapsedTime >= timeout) {
                clearInterval(checkGis);
                reject(new Error("Google Identity Services failed to load in time."));
            }
        }
    }, interval);
});

/**
 * Initializes the GIS token client.
 * @param callback - The function to call after a token is received.
 */
function initializeGisClient(clientId: string, callback: (resp: any) => void): ITokenClient {
  return window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: callback,
  });
}

/**
 * Main initialization function.
 * Ensures both GAPI and GIS are loaded and initialized.
 */
export async function initializeGoogleClients(): Promise<ITokenClient | null> {
    const API_KEY = process.env.API_KEY || '';
    // For real-world deployment, a separate GOOGLE_CLIENT_ID should be provided.
    // We fall back to API_KEY for sandbox compatibility.
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || API_KEY;

    if (!API_KEY || !CLIENT_ID) {
        console.warn("Google Drive credentials (API_KEY and/or GOOGLE_CLIENT_ID) are not configured. Drive integration will be disabled.");
        return null;
    }
    
    // gapiLoadPromise now handles initialization as well.
    await Promise.all([gapiLoadPromise, gisLoadPromise]);

    // The token client is created here with the dedicated CLIENT_ID
    tokenClient = initializeGisClient(CLIENT_ID, () => {});
    return tokenClient;
}

/**
 * Prompts the user for OAuth consent and retrieves an access token.
 * @param client - The token client instance.
 * @param callback - The callback to execute after the token response.
 */
export function requestAccessToken(client: ITokenClient, callback: (resp: any) => void) {
    (client as any).callback = callback;
    client.requestAccessToken({ prompt: 'consent' });
}

/**
 * Revokes the current user's access token.
 */
export function revokeToken() {
  const token = window.gapi.client.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('Access token revoked.');
      window.gapi.client.setToken(null);
    });
  }
}
