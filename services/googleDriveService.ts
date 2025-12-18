interface DriveUploadResponse {
  embedLink: string;
  id: string;
}

const DATA_FILE_NAME = 'auditors_guide_data.json';


/**
 * Finds a file by name in the user's Google Drive.
 * @param fileName The name of the file to find.
 * @returns The file ID if found, otherwise null.
 */
const findFileByName = async (fileName: string): Promise<string | null> => {
    try {
        const response = await window.gapi.client.drive.files.list({
            q: `name='${fileName}' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)',
        });
        
        if (response.result.files && response.result.files.length > 0) {
            return response.result.files[0].id;
        }
        return null;
    } catch (error) {
        console.error('Error finding file:', error);
        return null;
    }
};

/**
 * Creates a new file with initial content in Google Drive.
 * @param fileName The name of the file to create.
 * @param content The initial content of the file.
 * @returns The ID of the newly created file.
 */
const createFile = async (fileName: string, content: string): Promise<string> => {
    const metadata = {
        name: fileName,
        mimeType: 'application/json',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        close_delim;
        
    const response = await window.gapi.client.request({
        path: 'https://www.googleapis.com/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipartRequestBody,
    });

    return response.result.id;
};

/**
 * Finds the data file, or creates it if it doesn't exist.
 * @param initialContent The content to use if the file needs to be created.
 * @returns The ID of the data file.
 */
export const findOrCreateDataFile = async (initialContent: string): Promise<string> => {
    let fileId = await findFileByName(DATA_FILE_NAME);
    if (!fileId) {
        fileId = await createFile(DATA_FILE_NAME, initialContent);
    }
    return fileId;
};

/**
 * Uploads/updates the application data to the specified file in Google Drive.
 * @param fileId The ID of the file to update.
 * @param data The application state object to save.
 */
export const uploadData = async (fileId: string, data: object): Promise<void> => {
    const content = JSON.stringify(data, null, 2);
    await window.gapi.client.request({
        path: `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'media' },
        headers: { 'Content-Type': 'application/json' },
        body: content,
    });
};

/**
 * Loads the application data from the specified file in Google Drive.
 * @param fileId The ID of the file to load.
 * @returns The parsed application state object.
 */
export const loadData = async (fileId: string): Promise<any> => {
    const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
    });
    return JSON.parse(response.body);
};


/**
 * Uploads a file to Google Drive using the GAPI client.
 * @param file The file object to upload.
 * @returns A promise that resolves with the file ID and an embed link.
 */
export const uploadFile = async (file: File): Promise<DriveUploadResponse> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = async () => {
      const fileContent = reader.result;
      const metadata = {
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;

      let multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + (file.type || 'application/octet-stream') + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n\r\n';

      // The FileReader result is an ArrayBuffer, we need to convert it to a base64 string.
      const base64Data = btoa(new Uint8Array(fileContent as ArrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      multipartRequestBody += base64Data + close_delim;
      
      try {
        const response = await window.gapi.client.request({
          path: 'https://www.googleapis.com/upload/drive/v3/files',
          method: 'POST',
          params: { uploadType: 'multipart' },
          headers: {
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        });

        const fileId = response.result.id;
        
        // Make file publicly readable for the embed link to work
        await window.gapi.client.drive.permissions.create({
          fileId: fileId,
          resource: {
            role: 'reader',
            type: 'anyone',
          }
        });

        const uploadResponse: DriveUploadResponse = {
          id: fileId,
          embedLink: `https://drive.google.com/file/d/${fileId}/preview`,
        };
        
        resolve(uploadResponse);

      } catch (error) {
        console.error("Error uploading file to Google Drive:", error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
        reject(error);
    };
  });
};