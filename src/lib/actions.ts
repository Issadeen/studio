'use server';

import type { TruckLog } from '@/lib/types';
// Note: In a real app, you'd use a database here.
// This is a placeholder using in-memory storage for demonstration.
let truckLogs: TruckLog[] = [];

// Simple function to generate a unique permit number
function generatePermitNumber(): string {
  return `PERMIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

export async function addTruckLogAction(data: Omit<TruckLog, 'id' | 'permitNumber' | 'isLoaded' | 'expiryDate'>): Promise<TruckLog | { error: string }> {
  console.log('Received data:', data);
  try {
    const permitNumber = generatePermitNumber();
    const newLog: TruckLog = {
      ...data,
      id: permitNumber, // Use permit number as ID for simplicity
      permitNumber: permitNumber,
      isLoaded: false, // Default to not loaded
      expiryDate: data.isPreChecked && data.preCheckDate
        ? new Date(data.preCheckDate.getTime() + 72 * 60 * 60 * 1000)
        : null,
    };

    // Add validation if needed

    // Simulate database insertion
    truckLogs.unshift(newLog); // Add to the beginning of the array
    console.log('Added new log:', newLog);
    console.log('Current logs:', truckLogs);

    // Revalidate path or tag if using Next.js caching and fetching data on the page
    // revalidatePath('/');

    return newLog;
  } catch (error) {
    console.error("Error adding truck log:", error);
    return { error: "Failed to add truck log." };
  }
}

export async function updateTruckLogAction(logId: string, updates: Partial<TruckLog>): Promise<TruckLog | { error: string }> {
  try {
    const logIndex = truckLogs.findIndex(log => log.id === logId);
    if (logIndex === -1) {
      return { error: "Truck log not found." };
    }

    // Update the log
    const updatedLog = { ...truckLogs[logIndex], ...updates };

    // Recalculate expiry if preCheckDate changes
    if ('preCheckDate' in updates || 'isPreChecked' in updates) {
       updatedLog.expiryDate = updatedLog.isPreChecked && updatedLog.preCheckDate
        ? new Date(updatedLog.preCheckDate.getTime() + 72 * 60 * 60 * 1000)
        : null;
    }


    truckLogs[logIndex] = updatedLog;
    console.log('Updated log:', updatedLog);

    // Revalidate path or tag
    // revalidatePath('/');

    return updatedLog;
  } catch (error) {
    console.error("Error updating truck log:", error);
    return { error: "Failed to update truck log." };
  }
}


export async function getTruckLogsAction(): Promise<TruckLog[]> {
  // Simulate database fetch
   console.log('Fetching logs:', truckLogs);
  return Promise.resolve(truckLogs);
}

// Placeholder for Excel export - Requires a library like 'xlsx'
// and handling file download response.
export async function exportTruckLogsAction(): Promise<{ success: boolean; message?: string; error?: string }> {
  console.log("Exporting logs:", truckLogs);
   // In a real app:
   // 1. Import 'xlsx' library (npm install xlsx)
   // 2. Format `truckLogs` data into a worksheet structure.
   // 3. Create a workbook.
   // 4. Generate the Excel file buffer.
   // 5. Return the buffer or trigger a download (needs different setup for server actions).
   // This basic implementation just logs for now.
   if (truckLogs.length === 0) {
     return { success: false, message: "No data to export." };
   }

   // Example structure (would need actual xlsx logic)
   const dataToExport = truckLogs.map(log => ({
       'Truck Number': log.truckNumber,
       'Date': log.date.toLocaleDateString(),
       'Product': log.product,
       'Company': log.company,
       'Permit Number': log.permitNumber,
       'Pre-Checked': log.isPreChecked ? 'Yes' : 'No',
       'Pre-Check Date': log.preCheckDate ? log.preCheckDate.toLocaleString() : 'N/A',
       'Loaded': log.isLoaded ? 'Yes' : 'No',
       'Expiry Date': log.expiryDate ? log.expiryDate.toLocaleString() : 'N/A',
   }));

   console.log("Formatted for export:", dataToExport);
   // TODO: Add actual Excel generation and download logic.
   // For now, simulate success.
   return { success: true, message: `Simulated export of ${truckLogs.length} logs.` };
}
