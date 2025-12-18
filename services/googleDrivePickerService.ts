interface DriveFile {
    name: string;
    mimeType: string;
    content: string;
}

let pickerApiLoaded = false;

// Load the picker API
const loadPickerApi = () => {
    return new Promise<void>((resolve) => {
        if (pickerApiLoaded) {
            resolve();
            return;
        }
        window.gapi.load('picker', () => {
            pickerApiLoaded = true;
            resolve();
        });
    });
};

/**
 * Opens the Google Drive file picker and fetches the content of the selected file.
 * @returns A promise that resolves with the file's name, MIME type, and content.
 */
export const pickFile = async (): Promise<DriveFile> => {
    await loadPickerApi();

    return new Promise((resolve, reject) => {
        const token = window.gapi.client.getToken();
        if (!token) {
            return reject('No access token available. Please connect to Google Drive first.');
        }
        const accessToken = token.access_token;
        
        const showPicker = () => {
            const picker = new window.google.picker.PickerBuilder()
                .addView(window.google.picker.ViewId.DOCS)
                .setOAuthToken(accessToken)
                .setDeveloperKey(process.env.API_KEY || '')
                .setCallback(async (data: any) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const fileId = data.docs[0].id;
                        const fileName = data.docs[0].name;
                        const mimeType = data.docs[0].mimeType;

                        try {
                            const response = await window.gapi.client.drive.files.get({
                                fileId: fileId,
                                alt: 'media',
                            });

                            resolve({
                                name: fileName,
                                mimeType: mimeType,
                                content: response.body, // The content of text files is returned directly in the body
                            });
                        } catch (error) {
                            console.error('Error fetching file content:', error);
                            reject(error);
                        }
                    } else if (data.action === window.google.picker.Action.CANCEL) {
                        reject('Picker was cancelled');
                    }
                })
                .build();
            picker.setVisible(true);
        };
        showPicker();
    });
};