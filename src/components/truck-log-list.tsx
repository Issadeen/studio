'use client';

import React, { useState, useEffect } from 'react';
import { TruckLog, MarkAsPreCheckedInput, MarkAsLoadedInput } from '@/lib/types';
import { format, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Truck, Package, Building, CalendarDays, Clock, CheckCircle, XCircle, Hourglass, AlertTriangle, Loader, Droplet, FileText, FileInput, ClipboardCheck, CalendarIcon } from 'lucide-react'; // Added/updated icons
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { markAsPreCheckedAction, markAsLoadedAction } from '@/lib/actions'; // Updated actions
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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

// --- Expiry Countdown Component ---
const ExpiryCountdown: React.FC<{ expiryDate: Date, isLoaded: boolean, preCheckDate: Date | null }> = ({ expiryDate, isLoaded, preCheckDate }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(100);
  const [status, setStatus] = useState<'valid' | 'warning' | 'expired'>('valid');

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const calculateTimeLeft = () => {
        if (isLoaded) {
            setTimeLeft('Loaded');
            setProgress(0); // Consider setting to 0 or 100 based on desired visual for loaded state
            setStatus('valid'); // Or a specific 'loaded' status if needed
            if (timer) clearInterval(timer);
            return;
        }

        const now = new Date();
        const totalDuration = 72 * 60 * 60; // 72 hours in seconds
        const secondsRemaining = differenceInSeconds(expiryDate, now);

        if (secondsRemaining <= 0) {
            setTimeLeft('Expired');
            setProgress(0);
            setStatus('expired');
            if (timer) clearInterval(timer);
        } else {
            const hoursLeft = Math.floor(secondsRemaining / 3600);
            const minutesLeft = Math.floor((secondsRemaining % 3600) / 60);
            const secondsLeft = secondsRemaining % 60;
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

    if (preCheckDate && !isLoaded) {
        calculateTimeLeft(); // Initial calculation only if pre-checked and not loaded
        timer = setInterval(calculateTimeLeft, 1000);
    } else if (isLoaded) {
         setTimeLeft('Loaded');
         setProgress(0); // Or 100 if preferred
         setStatus('valid');
    } else {
        // Not pre-checked yet
         setTimeLeft('N/A');
         setProgress(100); // Full bar initially
         setStatus('valid'); // Or a 'pending' status
    }


    return () => {
        if (timer) clearInterval(timer); // Cleanup on unmount or when state changes
    };
  }, [expiryDate, isLoaded, preCheckDate]);


  const getProgressColor = () => {
     if (isLoaded) return 'bg-gray-400'; // Grey if loaded
     switch (status) {
        case 'expired': return 'bg-red-500';
        case 'warning': return 'bg-yellow-500';
        default: return 'bg-green-500'; // Use green for valid/pending
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
            ) : preCheckDate ? (
                <Hourglass className="mr-1 h-4 w-4 text-green-500" />
            ) : (
                 <Hourglass className="mr-1 h-4 w-4 text-muted-foreground" /> // Icon for pending pre-check
            )}
            Expiry Countdown:
         </span>
        <span className={`font-semibold ${status === 'expired' ? 'text-red-500' : status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
          {timeLeft}
        </span>
      </div>
      <Progress value={progress} className="h-2 [&>*]:bg-unset" style={{ '--progress-color': getProgressColor() } as React.CSSProperties} indicatorClassName={getProgressColor()} />
      {!isLoaded && status === 'expired' && <p className="text-xs text-red-500">Pre-check has expired!</p>}
      {isLoaded && <p className="text-xs text-muted-foreground">Timer stopped (Truck Loaded)</p>}
      {!isLoaded && preCheckDate && status !== 'expired' && <p className="text-xs text-muted-foreground">Expires on: {format(expiryDate, "PPP HH:mm")}</p>}
       {!preCheckDate && !isLoaded && <p className="text-xs text-muted-foreground">Awaiting pre-check.</p>}
    </div>
  );
};


// --- Mark as Pre-Checked Modal ---
const MarkPreCheckedModal: React.FC<{
  logId: string;
  truckNumber: string;
  onConfirm: (logId: string, preCheckDate: Date) => void;
  isLoading: boolean;
}> = ({ logId, truckNumber, onConfirm, isLoading }) => {
  const [preCheckDate, setPreCheckDate] = useState<Date | undefined>(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
      if (!preCheckDate) {
          alert("Please select a pre-check date and time.");
          return;
      }
      onConfirm(logId, preCheckDate);
      setIsOpen(false); // Close dialog on confirm
      setPreCheckDate(new Date()); // Reset date for next time
  };

  const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
          setPreCheckDate(new Date()); // Reset date if dialog is closed
      }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
         <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
         >
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
            Mark as Pre-Checked
         </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark Pre-Checked for Truck {truckNumber}</AlertDialogTitle>
          <AlertDialogDescription>
            Select the date and time the pre-check was completed. An expiry timer of 72 hours will start.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
           <Label>Pre-Check Date & Time</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !preCheckDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {preCheckDate ? format(preCheckDate, "PPP HH:mm") : <span>Pick date and time</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={preCheckDate}
                        onSelect={(date) => {
                            const selectedDate = date || new Date();
                            const currentTime = preCheckDate || new Date();
                            const newDateTime = new Date(
                                selectedDate.getFullYear(),
                                selectedDate.getMonth(),
                                selectedDate.getDate(),
                                currentTime.getHours(),
                                currentTime.getMinutes()
                            );
                            setPreCheckDate(newDateTime);
                        }}
                        initialFocus
                        // Optional: Disable future dates?
                        // disabled={(date) => date > new Date()}
                    />
                    {/* Time Picker */}
                    <div className="p-2 border-t flex justify-center gap-2">
                        <Input
                            type="time"
                            value={preCheckDate ? format(preCheckDate, "HH:mm") : ""}
                            onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const currentVal = preCheckDate || new Date();
                                const newDate = new Date(currentVal);
                                newDate.setHours(hours, minutes);
                                setPreCheckDate(newDate);
                            }}
                            className="w-auto"
                            suppressHydrationWarning // Add suppressHydrationWarning here
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading || !preCheckDate}>
            {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm Pre-Check
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


// --- Mark as Loaded Modal ---
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
      if (!at2oNumber || !bolNumber) {
          alert("Please enter both AT2O and BOL numbers."); // Simple validation
          return;
      }
      onConfirm(logId, at2oNumber, bolNumber);
      setIsOpen(false);
      setAt2oNumber(''); // Reset fields
      setBolNumber('');
  };

  const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (!open) {
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
            className="bg-primary hover:bg-primary/90" // Use primary color for main action
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
              suppressHydrationWarning // Add suppressHydrationWarning here
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
              suppressHydrationWarning // Add suppressHydrationWarning here
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


// --- Main Truck Log List Component ---
export function TruckLogList({ initialLogs }: TruckLogListProps) {
   const [logs, setLogs] = useState<TruckLog[]>(initialLogs);
   // Use a single state object to track loading for different actions per log
   const [loadingStates, setLoadingStates] = useState<Record<string, { preCheck?: boolean; load?: boolean }>>({});
   const { toast } = useToast();

   // Effect to update local state when initialLogs prop changes (e.g., after adding a new log)
   useEffect(() => {
       setLogs(initialLogs.map(log => ({
           ...log,
           date: new Date(log.date), // Ensure dates are Date objects
           preCheckDate: log.preCheckDate ? new Date(log.preCheckDate) : null,
           expiryDate: log.expiryDate ? new Date(log.expiryDate) : null,
       })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())); // Keep sorted
   }, [initialLogs]);

   // Helper to update loading state for a specific action on a log
   const setLoading = (logId: string, action: 'preCheck' | 'load', isLoading: boolean) => {
        setLoadingStates(prev => ({
            ...prev,
            [logId]: {
                ...prev[logId],
                [action]: isLoading,
            }
        }));
   };

    const handleMarkPreChecked = async (logId: string, preCheckDate: Date) => {
        setLoading(logId, 'preCheck', true);
        try {
            const input: MarkAsPreCheckedInput = { preCheckDate };
            const result = await markAsPreCheckedAction(logId, input);

            if ('error' in result) {
                toast({ variant: "destructive", title: "Pre-Check Error", description: result.error });
            } else {
                // Update local state immediately for better UX
                setLogs(prevLogs => prevLogs.map(log => log.id === logId ? {
                    ...log,
                    isPreChecked: true,
                    preCheckDate: new Date(result.preCheckDate!), // Ensure date object
                    expiryDate: new Date(result.expiryDate!),     // Ensure date object
                } : log));
                toast({ title: "Success", description: `Truck ${result.truckNumber} marked as pre-checked.` });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to mark as pre-checked." });
        } finally {
            setLoading(logId, 'preCheck', false);
        }
    };


   const handleMarkLoaded = async (logId: string, at2oNumber: string, bolNumber: string) => {
      setLoading(logId, 'load', true);
      try {
           const input: MarkAsLoadedInput = { at2oNumber, bolNumber };
          const result = await markAsLoadedAction(logId, input); // Use the specific action

          if ('error' in result) {
              toast({ variant: "destructive", title: "Loading Error", description: result.error });
          } else {
              // Update local state
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
          setLoading(logId, 'load', false);
      }
   };

   if (!logs || logs.length === 0) {
     return <Alert className="mt-6">
              <Truck className="h-4 w-4"/>
              <AlertTitle>No Logs Yet</AlertTitle>
              <AlertDescription>
                Start by adding a new truck log using the form.
              </AlertDescription>
            </Alert>;
   }

  return (
    <div className="space-y-4 mt-8">
       <h2 className="text-2xl font-semibold tracking-tight">Trucking Monitor</h2>
      {logs.map((log) => {
        const isExpired = log.isPreChecked && log.expiryDate && new Date() > new Date(log.expiryDate);
        const canMarkPreChecked = !log.isPreChecked && !log.isLoaded;
        const canMarkLoaded = log.isPreChecked && !isExpired && !log.isLoaded;
        const isLoadingPreCheck = loadingStates[log.id]?.preCheck ?? false;
        const isLoadingLoad = loadingStates[log.id]?.load ?? false;

        return (
            <Card key={log.id} className={`shadow-md ${log.isLoaded ? 'opacity-70' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <CardTitle className="flex items-center text-xl"><Truck className="mr-2 h-5 w-5 text-primary" /> {log.truckNumber}</CardTitle>
                         <CardDescription>
                            Permit: <Badge variant="secondary">{log.permitNumber}</Badge> | EPAP: <Badge variant="outline">{log.epapNumber}</Badge>
                         </CardDescription>
                    </div>
                    <Badge variant={log.isLoaded ? "default" : isExpired ? "destructive" : log.isPreChecked ? "outline" : "secondary"} className="whitespace-nowrap flex-shrink-0">
                    {log.isLoaded ? "Loaded" : isExpired ? "Pre-Check Expired" : log.isPreChecked ? "Pre-Checked" : "Pending Pre-Check"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                    <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Date Added:</strong> <span className="ml-1">{format(new Date(log.date), 'PPP')}</span></div>
                    <div className="flex items-center"><Package className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Product:</strong> <span className="ml-1">{log.product}</span></div>
                    <div className="flex items-center"><Droplet className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Quantity:</strong> <span className="ml-1">{log.quantity.toLocaleString()} L</span></div>
                    <div className="flex items-center sm:col-span-2 lg:col-span-1"><Building className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Company:</strong> <span className="ml-1">{log.company}</span></div>
                    {log.isPreChecked && log.preCheckDate && (
                        <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Pre-Checked:</strong> <span className="ml-1">{format(new Date(log.preCheckDate), 'PPP HH:mm')}</span></div>
                    )}
                     {/* Display AT2O and BOL if loaded */}
                    {log.isLoaded && log.at2oNumber && (
                         <div className="flex items-center"><FileText className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>AT2O No:</strong> <span className="ml-1">{log.at2oNumber}</span></div>
                    )}
                    {log.isLoaded && log.bolNumber && (
                        <div className="flex items-center"><FileInput className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>BOL No:</strong> <span className="ml-1">{log.bolNumber}</span></div>
                    )}
                </div>

                {/* Show Countdown only if Pre-checked */}
                {log.isPreChecked && log.expiryDate && (
                    <ExpiryCountdown
                        expiryDate={new Date(log.expiryDate)}
                        isLoaded={log.isLoaded}
                        preCheckDate={log.preCheckDate ? new Date(log.preCheckDate) : null}
                     />
                )}
                 {!log.isPreChecked && !log.isLoaded && (
                     <div className="flex items-center text-orange-600 dark:text-orange-400 pt-2 text-sm">
                        <Hourglass className="mr-2 h-4 w-4" /> Awaiting pre-check information.
                    </div>
                 )}

                <div className="flex items-center gap-2 pt-3 border-t mt-4">
                    {/* Mark as Pre-Checked Button */}
                    {canMarkPreChecked && (
                         <MarkPreCheckedModal
                            logId={log.id}
                            truckNumber={log.truckNumber}
                            onConfirm={handleMarkPreChecked}
                            isLoading={isLoadingPreCheck}
                        />
                    )}

                    {/* Mark as Loaded Button */}
                    {canMarkLoaded && (
                        <MarkLoadedModal
                            logId={log.id}
                            truckNumber={log.truckNumber}
                            onConfirm={handleMarkLoaded}
                            isLoading={isLoadingLoad}
                        />
                    )}
                     {/* Display status messages */}
                     {log.isLoaded && (
                        <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                            <CheckCircle className="mr-2 h-4 w-4" /> Truck successfully loaded.
                        </div>
                    )}
                     {isExpired && !log.isLoaded && (
                        <div className="flex items-center text-red-600 dark:text-red-400 text-sm">
                            <XCircle className="mr-2 h-4 w-4" /> Pre-check has expired. Cannot mark as loaded.
                        </div>
                    )}
                </div>

            </CardContent>
            </Card>
        )
    })}
    </div>
  );
}
