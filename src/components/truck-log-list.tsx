'use client';

import React, { useState, useEffect } from 'react';
import { TruckLog } from '@/lib/types';
import { format, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Truck, Package, Building, CalendarDays, Clock, CheckCircle, XCircle, Hourglass, AlertTriangle, Loader, Droplet, FileText, FileInput } from 'lucide-react'; // Added icons
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTruckLogAction } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TruckLogListProps {
  initialLogs: TruckLog[];
}

const ExpiryCountdown: React.FC<{ expiryDate: Date, isLoaded: boolean }> = ({ expiryDate, isLoaded }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(100);
  const [status, setStatus] = useState<'valid' | 'warning' | 'expired'>('valid');

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const calculateTimeLeft = () => {
        if (isLoaded) {
            setTimeLeft('Loaded');
            setProgress(0);
            setStatus('valid');
            if (timer) clearInterval(timer);
            return;
        }

        const now = new Date();
        const totalDuration = 72 * 60 * 60; // 72 hours in seconds
        const hoursLeft = differenceInHours(expiryDate, now);
        const minutesLeft = differenceInMinutes(expiryDate, now) % 60;
        const secondsLeft = differenceInSeconds(expiryDate, now) % 60;
        const secondsRemaining = differenceInSeconds(expiryDate, now);

        if (secondsRemaining <= 0) {
            setTimeLeft('Expired');
            setProgress(0);
            setStatus('expired');
            if (timer) clearInterval(timer);
        } else {
            const currentProgress = Math.max(0, Math.min(100, (secondsRemaining / totalDuration) * 100));
            setTimeLeft(`${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`);
            setProgress(currentProgress);

            if (hoursLeft < 12) { // Warning threshold: 12 hours
                setStatus('warning');
            } else {
                setStatus('valid');
            }
        }
    };

    calculateTimeLeft(); // Initial calculation
    if (!isLoaded) {
        timer = setInterval(calculateTimeLeft, 1000);
    }

    return () => {
        if (timer) clearInterval(timer); // Cleanup on unmount or when expiryDate/isLoaded changes
    };
}, [expiryDate, isLoaded]);


  const getProgressColor = () => {
     if (isLoaded) return 'bg-gray-400'; // Grey if loaded
     switch (status) {
        case 'expired': return 'bg-red-500';
        case 'warning': return 'bg-yellow-500';
        default: return 'bg-green-500'; // Use green for valid
     }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
         <span className="font-medium flex items-center">
            {isLoaded ? (
                <CheckCircle className="mr-1 h-4 w-4 text-green-500"/>
            ) : status === 'expired' ? (
                <XCircle className="mr-1 h-4 w-4 text-red-500"/>
            ) : status === 'warning' ? (
                <AlertTriangle className="mr-1 h-4 w-4 text-yellow-500"/>
            ) : (
                <Hourglass className="mr-1 h-4 w-4 text-green-500" />
            )}
            Expiry Countdown:
         </span>
        <span className={`font-semibold ${status === 'expired' ? 'text-red-500' : status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
          {timeLeft}
        </span>
      </div>
      <Progress value={progress} className="h-2 [&>*]:bg-unset" style={{ '--progress-color': getProgressColor() } as React.CSSProperties} indicatorClassName={getProgressColor()} />
      {!isLoaded && status !== 'expired' && <p className="text-xs text-muted-foreground">Expires on: {format(expiryDate, "PPP HH:mm")}</p>}
      {isLoaded && <p className="text-xs text-muted-foreground">Timer stopped (Truck Loaded)</p>}
       {status === 'expired' && <p className="text-xs text-red-500">Pre-check has expired!</p>}
    </div>
  );
};

// Modal for AT2O and BOL numbers
const MarkLoadedModal: React.FC<{
  logId: string;
  truckNumber: string;
  onConfirm: (logId: string, at2o: string, bol: string) => void;
  isLoading: boolean;
}> = ({ logId, truckNumber, onConfirm, isLoading }) => {
  const [at2oNumber, setAt2oNumber] = useState('');
  const [bolNumber, setBolNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
      // Basic validation (optional, add more as needed)
      if (!at2oNumber || !bolNumber) {
          alert("Please enter both AT2O and BOL numbers.");
          return;
      }
      onConfirm(logId, at2oNumber, bolNumber);
      setIsOpen(false); // Close dialog on confirm
      // Reset fields for next time
      setAt2oNumber('');
      setBolNumber('');
  };

  const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
          // Reset fields if dialog is closed without confirming
          setAt2oNumber('');
          setBolNumber('');
      }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
            size="sm"
            disabled={isLoading}
            className="bg-accent hover:bg-accent/90"
         >
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Mark as Loaded
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Load for Truck {truckNumber}</AlertDialogTitle>
          <AlertDialogDescription>
            Please enter the AT2O and BOL numbers before marking the truck as loaded.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="at2o" className="text-right col-span-1">
              AT2O No.
            </Label>
            <Input
              id="at2o"
              value={at2oNumber}
              onChange={(e) => setAt2oNumber(e.target.value)}
              className="col-span-3"
              placeholder="Enter AT2O number"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bol" className="text-right col-span-1">
              BOL No.
            </Label>
            <Input
              id="bol"
              value={bolNumber}
              onChange={(e) => setBolNumber(e.target.value)}
              className="col-span-3"
              placeholder="Enter BOL number"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading || !at2oNumber || !bolNumber}>
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm & Mark Loaded
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export function TruckLogList({ initialLogs }: TruckLogListProps) {
   const [logs, setLogs] = useState<TruckLog[]>(initialLogs);
   const [isLoading, setIsLoading] = useState<Record<string, boolean>>({}); // Track loading state per log
   const { toast } = useToast();

   useEffect(() => {
       setLogs(initialLogs.map(log => ({
           ...log,
           date: new Date(log.date), // Ensure dates are Date objects
           preCheckDate: log.preCheckDate ? new Date(log.preCheckDate) : null,
           expiryDate: log.expiryDate ? new Date(log.expiryDate) : null,
       })));
   }, [initialLogs]);

   const handleMarkLoaded = async (logId: string, at2oNumber: string, bolNumber: string) => {
      setIsLoading(prev => ({ ...prev, [logId]: true }));
      try {
          const result = await updateTruckLogAction(logId, {
              isLoaded: true,
              at2oNumber: at2oNumber,
              bolNumber: bolNumber
          });
          if ('error' in result) {
              toast({ variant: "destructive", title: "Error", description: result.error });
          } else {
              setLogs(prevLogs => prevLogs.map(log => log.id === logId ? {
                  ...log,
                  isLoaded: true,
                  at2oNumber: result.at2oNumber,
                  bolNumber: result.bolNumber
              } : log));
              toast({ title: "Success", description: `Truck ${result.truckNumber} marked as loaded.` });
          }
      } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
      } finally {
          setIsLoading(prev => ({ ...prev, [logId]: false }));
      }
   };

   if (!logs || logs.length === 0) {
     return <Alert className="mt-6">
              <Truck className="h-4 w-4"/>
              <AlertTitle>No Logs Yet</AlertTitle>
              <AlertDescription>
                Start by adding a new truck log using the form above.
              </AlertDescription>
            </Alert>;
   }

  return (
    <div className="space-y-4 mt-8">
       <h2 className="text-2xl font-semibold tracking-tight">Trucking Monitor</h2>
      {logs.map((log) => {
        const isExpired = log.isPreChecked && log.expiryDate && new Date() > log.expiryDate;
        const canMarkLoaded = log.isPreChecked && !isExpired && !log.isLoaded;

        return (
            <Card key={log.id} className="shadow-md">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center text-xl"><Truck className="mr-2 h-5 w-5 text-primary" /> {log.truckNumber}</CardTitle>
                        <CardDescription>Permit: <Badge variant="secondary">{log.permitNumber}</Badge> | EPRA: <Badge variant="outline">{log.epraNumber}</Badge></CardDescription>
                    </div>
                    <Badge variant={log.isLoaded ? "default": isExpired ? "destructive" : log.isPreChecked ? "outline" : "secondary"} className="whitespace-nowrap">
                    {log.isLoaded ? "Loaded" : isExpired ? "Expired" : log.isPreChecked ? "Pre-Checked" : "Pending Pre-Check"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Date:</strong> <span className="ml-1">{format(log.date, 'PPP')}</span></div>
                    <div className="flex items-center"><Package className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Product:</strong> <span className="ml-1">{log.product}</span></div>
                    <div className="flex items-center"><Droplet className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Quantity:</strong> <span className="ml-1">{log.quantity.toLocaleString()} L</span></div>
                    <div className="flex items-center sm:col-span-2 lg:col-span-1"><Building className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Company:</strong> <span className="ml-1">{log.company}</span></div>
                    {log.isPreChecked && log.preCheckDate && (
                        <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Pre-Checked:</strong> <span className="ml-1">{format(log.preCheckDate, 'PPP HH:mm')}</span></div>
                    )}
                    {log.isLoaded && log.at2oNumber && (
                         <div className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>AT2O No:</strong> <span className="ml-1">{log.at2oNumber}</span></div>
                    )}
                    {log.isLoaded && log.bolNumber && (
                        <div className="flex items-center"><FileInput className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>BOL No:</strong> <span className="ml-1">{log.bolNumber}</span></div>
                    )}
                </div>

                {log.isPreChecked && log.expiryDate && (
                    <ExpiryCountdown expiryDate={log.expiryDate} isLoaded={log.isLoaded} />
                )}

                {canMarkLoaded && (
                    <div className="flex items-center gap-2 pt-2">
                        <MarkLoadedModal
                            logId={log.id}
                            truckNumber={log.truckNumber}
                            onConfirm={handleMarkLoaded}
                            isLoading={isLoading[log.id]}
                        />
                    </div>
                )}

                {log.isLoaded && (
                    <div className="flex items-center text-green-600 dark:text-green-400 pt-2">
                        <CheckCircle className="mr-2 h-4 w-4" /> Truck successfully loaded.
                    </div>
                )}
                {!log.isPreChecked && (
                    <div className="flex items-center text-orange-600 dark:text-orange-400 pt-2">
                        <Hourglass className="mr-2 h-4 w-4" /> Awaiting pre-check information.
                    </div>
                )}
                {isExpired && !log.isLoaded && (
                    <div className="flex items-center text-red-600 dark:text-red-400 pt-2">
                        <XCircle className="mr-2 h-4 w-4" /> Pre-check has expired. Cannot mark as loaded.
                    </div>
                )}

            </CardContent>
            </Card>
        )
    })}
    </div>
  );
}

// Placeholder Admin PO Quantity Component
// In a real app, this would fetch/update data from a source
const POQuantityDisplay: React.FC = () => {
    // Example state - replace with actual data fetching/management
    const [poQuantities, setPoQuantities] = useState<{ pms: number; ago: number }>({ pms: 500000, ago: 750000 });
    const [isAdminMode, setIsAdminMode] = useState(false); // Simple toggle for demo

    if (!isAdminMode) {
        // Could have a button to toggle admin mode
        return <Button onClick={() => setIsAdminMode(true)}>Enter Admin Mode</Button>;
    }

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>PO Quantities (Admin)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><strong>PMS:</strong> {poQuantities.pms.toLocaleString()} Litres</p>
                <p><strong>AGO:</strong> {poQuantities.ago.toLocaleString()} Litres</p>
                {/* Add forms/buttons to update quantities here */}
                <Button variant="outline" size="sm" onClick={() => setIsAdminMode(false)}>Exit Admin Mode</Button>
            </CardContent>
        </Card>
    );
}

// Example usage of POQuantityDisplay (optional, place where needed e.g., on the page)
// export function AdminSection() {
//     return <POQuantityDisplay />;
// }
