'use server';

import type { TruckLog, POQuantities } from '@/lib/types'; // Import POQuantities type
// Note: In a real app, you'd use a database here.
// This is a placeholder using in-memory storage for demonstration.
let truckLogs: TruckLog[] = [];
let poQuantities: POQuantities = { pms: 500000, ago: 750000 }; // Example initial PO quantities

// Simple function to generate a unique permit number
function generatePermitNumber(): string {
  return `PERMIT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

// Type for the data expected by addTruckLogAction, excluding generated fields
type AddTruckLogInput = Omit<TruckLog, 'id' | 'permitNumber' | 'isLoaded' | 'expiryDate' | 'at2oNumber' | 'bolNumber'>;

export async function addTruckLogAction(data: AddTruckLogInput): Promise<TruckLog | { error: string }> {
  console.log('Received data for adding log:', data);
  try {
    // Validate quantity (simple example)
    if (data.quantity <= 0) {
        return { error: "Quantity must be positive." };
    }
     // Validate EPRA (simple example)
    if (!data.epraNumber) {
        return { error: "EPRA Number is required." };
    }

    const permitNumber = generatePermitNumber();
    const newLog: TruckLog = {
      id: permitNumber, // Use permit number as ID for simplicity
      truckNumber: data.truckNumber,
      date: data.date,
      product: data.product,
      quantity: data.quantity,
      company: data.company,
      permitNumber: permitNumber,
      epraNumber: data.epraNumber,
      isPreChecked: data.isPreChecked,
      preCheckDate: data.preCheckDate ? data.preCheckDate : null,
      isLoaded: false, // Default to not loaded
      expiryDate: data.isPreChecked && data.preCheckDate
        ? new Date(data.preCheckDate.getTime() + 72 * 60 * 60 * 1000) // 72 hours expiry
        : null,
      at2oNumber: null, // Initialize optional fields
      bolNumber: null,   // Initialize optional fields
    };

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

export async function updateTruckLogAction(logId: string, updates: Partial<Pick<TruckLog, 'isLoaded' | 'at2oNumber' | 'bolNumber'>>): Promise<TruckLog | { error: string }> {
  console.log(`Updating log ${logId} with:`, updates);
  try {
    const logIndex = truckLogs.findIndex(log => log.id === logId);
    if (logIndex === -1) {
      return { error: "Truck log not found." };
    }

    const originalLog = truckLogs[logIndex];

    // Only allow updating isLoaded, at2oNumber, bolNumber via this specific action
    const allowedUpdates: Partial<TruckLog> = {};
    if (updates.isLoaded !== undefined) {
        // Ensure we don't un-load a truck via this action if needed
        if (originalLog.isLoaded && !updates.isLoaded) {
             return { error: "Cannot un-mark a truck as loaded through this action." };
        }
        // Check if pre-check is valid before marking as loaded
        const isExpired = originalLog.isPreChecked && originalLog.expiryDate && new Date() > originalLog.expiryDate;
        if (updates.isLoaded && (!originalLog.isPreChecked || isExpired)) {
            return { error: "Cannot mark as loaded: Truck is not pre-checked or pre-check has expired." };
        }
        allowedUpdates.isLoaded = updates.isLoaded;
    }
     if (updates.at2oNumber !== undefined) {
        allowedUpdates.at2oNumber = updates.at2oNumber;
    }
     if (updates.bolNumber !== undefined) {
        allowedUpdates.bolNumber = updates.bolNumber;
    }

     // Ensure AT2O and BOL are provided if marking as loaded
     if (allowedUpdates.isLoaded && (!allowedUpdates.at2oNumber || !allowedUpdates.bolNumber)) {
         return { error: "AT2O and BOL numbers are required to mark the truck as loaded." };
     }


    // Update the log with allowed fields
    const updatedLog = { ...originalLog, ...allowedUpdates };

    // Note: Expiry date calculation happens on creation or if preCheckDate is updated elsewhere.
    // This action specifically handles the loading confirmation.

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
   // Ensure date objects are correctly handled if stored as strings/timestamps
   const processedLogs = truckLogs.map(log => ({
       ...log,
       date: new Date(log.date),
       preCheckDate: log.preCheckDate ? new Date(log.preCheckDate) : null,
       expiryDate: log.expiryDate ? new Date(log.expiryDate) : null,
   }));
  return Promise.resolve(processedLogs);
}

// --- PO Quantity Actions (Admin) ---

export async function getPOQuantitiesAction(): Promise<POQuantities | { error: string }> {
    // Simulate fetching PO quantities - Add authentication/authorization checks here
    console.log("Fetching PO Quantities (Admin)");
    // if (!isAdmin) return { error: "Unauthorized" };
    return Promise.resolve(poQuantities);
}

export async function updatePOQuantitiesAction(newQuantities: Partial<POQuantities>): Promise<POQuantities | { error: string }> {
     // Simulate updating PO quantities - Add authentication/authorization checks here
    console.log("Updating PO Quantities (Admin) with:", newQuantities);
    // if (!isAdmin) return { error: "Unauthorized" };

    if (newQuantities.pms !== undefined && newQuantities.pms >= 0) {
        poQuantities.pms = newQuantities.pms;
    }
    if (newQuantities.ago !== undefined && newQuantities.ago >= 0) {
        poQuantities.ago = newQuantities.ago;
    }

    console.log("Updated PO Quantities:", poQuantities);
    // Revalidate relevant paths/tags if needed
    // revalidateTag('po-quantities');
    return Promise.resolve(poQuantities);
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
       'Quantity (L)': log.quantity,
       'Company': log.company,
       'Permit Number': log.permitNumber,
       'EPRA Number': log.epraNumber,
       'Pre-Checked': log.isPreChecked ? 'Yes' : 'No',
       'Pre-Check Date': log.preCheckDate ? log.preCheckDate.toLocaleString() : 'N/A',
       'Loaded': log.isLoaded ? 'Yes' : 'No',
       'Expiry Date': log.expiryDate ? log.expiryDate.toLocaleString() : 'N/A',
       'AT2O Number': log.at2oNumber || 'N/A',
       'BOL Number': log.bolNumber || 'N/A',
   }));

   console.log("Formatted for export:", dataToExport);
   // TODO: Add actual Excel generation and download logic.
   // For now, simulate success.
   return { success: true, message: `Simulated export of ${truckLogs.length} logs.` };
}
