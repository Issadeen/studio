export interface TruckLog {
  id: string; // Unique identifier, potentially the permit number
  truckNumber: string;
  date: Date;
  product: string;
  company: string;
  permitNumber: string;
  isPreChecked: boolean;
  preCheckDate?: Date | null; // Date when pre-check was done
  isLoaded: boolean; // To stop the expiry timer
  expiryDate?: Date | null; // Calculated: preCheckDate + 72 hours
}
