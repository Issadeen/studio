'use server';

import type { TruckLog, POQuantities, AddTruckLogInput, MarkAsPreCheckedInput, MarkAsLoadedInput } from '@/lib/types'; // Import necessary types
import { revalidatePath } from 'next/cache'; // Import revalidatePath

// Note: In a real app, you'd use a database here.
// This is a placeholder using in-memory storage for demonstration.
let truckLogs: TruckLog[] = [];
let poQuantities: POQuantities = { pms: 500000, ago: 750000 }; // Example initial PO quantities


export async function addTruckLogAction(data: AddTruckLogInput): Promise<TruckLog | { error: string }> {
  console.log('Received data for adding log:', data);
  try {
    // Validate input
    if (!data.epapNumber) {
        return { error: "EPAP Number is required." };
    }
    if (truckLogs.some(log => log.id === data.epapNumber)) {
        // Use epapNumber as the unique ID check
        return { error: "EPAP Number already exists." };
    }
    if (data.quantity <= 0) {
        return { error: "Quantity must be positive." };
    }
    if (!data.owner) {
        return { error: "Owner is required." };
    }


    const newLog: TruckLog = {
      id: data.epapNumber, // Use epapNumber as the unique ID
      truckNumber: data.truckNumber,
      date: new Date(data.date), // Ensure date is a Date object
      product: data.product,
      quantity: data.quantity,
      company: data.company,
      owner: data.owner, // Added owner
      epapNumber: data.epapNumber, // Still store epapNumber itself
      isPreChecked: false, // Default to not pre-checked
      preCheckDate: null, // Default to null
      isLoaded: false, // Default to not loaded
      expiryDate: null, // Default to null
      at2oNumber: null,
      bolNumber: null,
    };

    // Simulate database insertion
    truckLogs.unshift(newLog); // Add to the beginning of the array
    console.log('Added new log:', newLog);
    console.log('Current logs:', truckLogs);

    revalidatePath('/'); // Revalidate the page to show the new log

    // Updated success message
    return newLog;
  } catch (error) {
    console.error("Error adding truck log:", error);
    return { error: "Failed to add truck log." };
  }
}

export async function markAsPreCheckedAction(logId: string, input: MarkAsPreCheckedInput): Promise<TruckLog | { error: string }> {
    console.log(`Marking log ${logId} as pre-checked with date:`, input.preCheckDate);
    try {
        const logIndex = truckLogs.findIndex(log => log.id === logId);
        if (logIndex === -1) {
            return { error: "Truck log not found." };
        }

        const originalLog = truckLogs[logIndex];

        if (originalLog.isPreChecked) {
            return { error: "Truck already marked as pre-checked." };
        }

        const preCheckDate = new Date(input.preCheckDate); // Ensure it's a Date object
        const expiryDate = new Date(preCheckDate.getTime() + 72 * 60 * 60 * 1000); // 72 hours expiry

        const updatedLog: TruckLog = {
            ...originalLog,
            isPreChecked: true,
            preCheckDate: preCheckDate,
            expiryDate: expiryDate,
        };

        truckLogs[logIndex] = updatedLog;
        console.log('Updated log (pre-checked):', updatedLog);

        revalidatePath('/'); // Revalidate to show updated status

        return updatedLog;
    } catch (error) {
        console.error("Error marking as pre-checked:", error);
        return { error: "Failed to mark truck log as pre-checked." };
    }
}


export async function markAsLoadedAction(logId: string, input: MarkAsLoadedInput): Promise<TruckLog | { error: string }> {
  console.log(`Attempting to mark log ${logId} as loaded with:`, input);
  try {
    const logIndex = truckLogs.findIndex(log => log.id === logId);
    if (logIndex === -1) {
      return { error: "Truck log not found." };
    }

    const originalLog = truckLogs[logIndex];

    // Validation before marking as loaded
    if (originalLog.isLoaded) {
      return { error: "Truck already marked as loaded." };
    }
    if (!originalLog.isPreChecked) {
       return { error: "Cannot mark as loaded: Truck is not pre-checked." };
    }
    const isExpired = originalLog.expiryDate && new Date() > new Date(originalLog.expiryDate);
    if (isExpired) {
       return { error: "Cannot mark as loaded: Pre-check has expired." };
    }
     if (!input.at2oNumber || !input.bolNumber) {
         return { error: "AT2O and BOL numbers are required to mark the truck as loaded." };
     }


    // Update the log
    const updatedLog: TruckLog = {
      ...originalLog,
      isLoaded: true,
      at2oNumber: input.at2oNumber,
      bolNumber: input.bolNumber,
      // Note: expiryDate is NOT reset, timer effectively stops in the UI logic
    };

    truckLogs[logIndex] = updatedLog;
    console.log('Updated log (loaded):', updatedLog);

    revalidatePath('/'); // Revalidate to show updated status

    return updatedLog;
  } catch (error) {
    console.error("Error marking as loaded:", error);
    return { error: "Failed to mark truck log as loaded." };
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
   })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending
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
    revalidatePath('/'); // Revalidate page if PO quantities affect display
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
       'EPAP Number': log.epapNumber, // Use EPAP as primary ID now
       'Truck Number': log.truckNumber,
       'Owner': log.owner, // Added Owner
       'Date Added': log.date ? new Date(log.date).toLocaleString() : 'N/A',
       'Product': log.product,
       'Quantity (L)': log.quantity,
       'Company': log.company,
       'Pre-Checked': log.isPreChecked ? 'Yes' : 'No',
       'Pre-Check Date': log.preCheckDate ? new Date(log.preCheckDate).toLocaleString() : 'N/A',
       'Expiry Date': log.expiryDate ? new Date(log.expiryDate).toLocaleString() : 'N/A',
       'Loaded': log.isLoaded ? 'Yes' : 'No',
       'AT2O Number': log.at2oNumber || 'N/A',
       'BOL Number': log.bolNumber || 'N/A',
   }));


   console.log("Formatted for export:", dataToExport);
   // TODO: Add actual Excel generation and download logic.
   // For now, simulate success.
   return { success: true, message: `Simulated export of ${truckLogs.length} logs.` };
}
