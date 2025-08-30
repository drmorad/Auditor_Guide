// This is a mock service to simulate Google Drive API calls.
// In a real application, this would use the Google Drive API SDK
// and handle OAuth2 authentication.

interface DriveUploadResponse {
  embedLink: string;
  id: string;
}

/**
 * Simulates uploading a file to Google Drive.
 * @param file The file to be "uploaded".
 * @returns A promise that resolves with a mock response containing an embed link.
 */
export const uploadFile = (file: File): Promise<DriveUploadResponse> => {
  console.log(`Simulating upload for file: ${file.name}, size: ${file.size}, type: ${file.type}`);
  
  // Return a promise that resolves after a short delay to mimic network latency.
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real scenario, the file ID would be returned by the Drive API.
      // We'll use a hardcoded public PDF for demonstration purposes.
      const mockFileId = "1yjwZ6k3-L2D5-gH-AN532e-4-y5C-bYt";
      const response: DriveUploadResponse = {
        id: mockFileId,
        // Google Drive embed links follow this pattern.
        embedLink: `https://drive.google.com/file/d/${mockFileId}/preview`,
      };
      console.log("Simulated upload successful.", response);
      resolve(response);
    }, 1500); // 1.5-second delay
  });
};