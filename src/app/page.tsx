'use client';

import React, { useState, useEffect } from 'react';
import { TruckLogForm } from '@/components/truck-log-form';
import { TruckLogList } from '@/components/truck-log-list';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTruckLogsAction, exportTruckLogsAction } from '@/lib/actions';
import type { TruckLog } from '@/lib/types';
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const [logs, setLogs] = useState<TruckLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch initial logs on component mount
  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      try {
        const fetchedLogs = await getTruckLogsAction();
         // Ensure dates are Date objects (important if fetching from API/DB later)
         const processedLogs = fetchedLogs.map(log => ({
             ...log,
             date: new Date(log.date),
             preCheckDate: log.preCheckDate ? new Date(log.preCheckDate) : null,
             expiryDate: log.expiryDate ? new Date(log.expiryDate) : null,
         }));
        setLogs(processedLogs);
      } catch (error) {
        console.error("Failed to fetch logs:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load truck logs.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, [toast]); // Add toast dependency

   // Handler to update the list when a new log is added via the form
   const handleLogAdded = (newLog: TruckLog) => {
     // Ensure dates are Date objects when adding
      const processedLog = {
          ...newLog,
          date: new Date(newLog.date),
          preCheckDate: newLog.preCheckDate ? new Date(newLog.preCheckDate) : null,
          expiryDate: newLog.expiryDate ? new Date(newLog.expiryDate) : null,
      };
     setLogs(prevLogs => [processedLog, ...prevLogs]);
   };

  const handleExport = async () => {
    toast({ title: "Exporting...", description: "Preparing data for download." });
    const result = await exportTruckLogsAction();
    if (result.success) {
      toast({ title: "Export Ready", description: result.message || "Data ready (simulation)." });
      // In a real app, trigger file download here based on result.data or similar
    } else {
      toast({ variant: "destructive", title: "Export Failed", description: result.error || result.message || "Could not export data." });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
         <div className="container flex h-14 items-center">
            <div className="mr-4 hidden md:flex">
               {/* Placeholder for Logo/Brand */}
               <span className="text-lg font-bold">TruckLogistics Monitor</span>
            </div>
             {/* Add navigation items here if needed */}
            <div className="flex flex-1 items-center justify-end space-x-2">
                 <Button variant="outline" size="sm" onClick={handleExport} >
                   <Download className="mr-2 h-4 w-4" />
                   Export Excel
                 </Button>
                 <ThemeToggleButton />
            </div>
         </div>
      </header>

       <main className="container mx-auto p-4 md:p-8">
            <section className="mb-8 p-6 border rounded-lg shadow-sm bg-card">
                 <h2 className="text-2xl font-semibold mb-4">Add New Truck Log</h2>
                 <TruckLogForm onLogAdded={handleLogAdded} />
            </section>

            <section>
                 {isLoading ? (
                     <p>Loading logs...</p> // Replace with Skeleton loaders if desired
                 ) : (
                     <TruckLogList initialLogs={logs} />
                 )}
            </section>
       </main>

       <footer className="py-6 md:px-8 md:py-0 border-t mt-12">
         <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
           <p className="text-center text-sm leading-loose text-muted-foreground">
             Built with Next.js & ShadCN UI.
           </p>
         </div>
       </footer>
       <Toaster /> {/* Add Toaster component here */}
    </div>
  );
}
