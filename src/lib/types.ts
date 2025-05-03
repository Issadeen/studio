export interface TruckLog {
  id: string; // Unique identifier, now manually entered permit number
  truckNumber: string;
  date: Date;
  product: 'PMS' | 'AGO'; // Restricted product type
  quantity: number; // Added quantity field
  company: string;
  permitNumber: string; // Manually entered permit number
  epapNumber: string; // Changed from epraNumber
  isPreChecked: boolean; // Status if pre-checked
  preCheckDate: Date | null; // Date when pre-check was done, null if not pre-checked
  isLoaded: boolean; // To stop the expiry timer
  expiryDate: Date | null; // Calculated: preCheckDate + 72 hours, null if not pre-checked
  at2oNumber: string | null; // Added AT2O number (optional)
  bolNumber: string | null; // Added BOL number (optional)
}

// Type for adding a log - fields required at creation
export type AddTruckLogInput = Pick<TruckLog,
  'permitNumber' |
  'truckNumber' |
  'date' |
  'product' |
  'quantity' |
  'company' |
  'epapNumber'
>;


// Added type for PO Quantities (example)
export interface POQuantities {
  pms: number;
  ago: number;
}

// Type for marking as pre-checked
export interface MarkAsPreCheckedInput {
    preCheckDate: Date;
}

// Type for marking as loaded
export interface MarkAsLoadedInput {
    at2oNumber: string;
    bolNumber: string;
}
