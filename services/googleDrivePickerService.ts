interface MockDriveFile {
    name: string;
    mimeType: string;
    content: string;
}

/**
 * Simulates opening a Google Drive file picker and selecting a file.
 * @returns A promise that resolves with mock file data.
 */
export const pickFile = (): Promise<MockDriveFile> => {
    console.log("Simulating Google Drive file picker...");

    return new Promise((resolve) => {
        setTimeout(() => {
            const mockFile: MockDriveFile = {
                name: 'SOP_from_Drive.txt',
                mimeType: 'text/plain',
                content: `Standard Operating Procedure: Kitchen Closing Duties

Purpose: To ensure the kitchen is cleaned, sanitized, and secured at the end of each day.

Scope: Applies to all closing kitchen staff.

Procedure:
1. Turn off all cooking equipment (ovens, grills, fryers).
2. Clean all food contact surfaces with detergent, then rinse and sanitize.
3. Sweep and mop all floors, ensuring to clean under equipment.
4. Empty, clean, and re-line all trash receptacles.
5. Check and record temperatures of all refrigeration units.
6. Lock all storage areas, including refrigerators and dry storage.`
            };
            console.log("Simulated file 'picked':", mockFile.name);
            resolve(mockFile);
        }, 1200); // 1.2-second delay for simulation
    });
};
