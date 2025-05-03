export interface TruckLog {
  id: string; // Unique identifier, potentially the permit number
  truckNumber: string;
  date: Date;
  product: 'PMS' | 'AGO'; // Restricted product type
  quantity: number; // Added quantity field
  company: string;
  permitNumber: string;
  epraNumber: string; // Added EPRA number field
  isPreChecked: boolean;
  preCheckDate?: Date | null; // Date when pre-check was done
  isLoaded: boolean; // To stop the expiry timer
  expiryDate?: Date | null; // Calculated: preCheckDate + 72 hours
  at2oNumber?: string | null; // Added AT2O number (optional)
  bolNumber?: string | null; // Added BOL number (optional)
}

// Added type for PO Quantities (example)
export interface POQuantities {
  pms: number;
  ago: number;
}
