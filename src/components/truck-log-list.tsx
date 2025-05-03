'use client';

import React, { useState, useEffect } from 'react';
import { TruckLog } from '@/lib/types';
import { format, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Truck, Package, Building, CalendarDays, Clock, CheckCircle, XCircle, Hourglass, AlertTriangle, Loader } from 'lucide-react';
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
    if (isLoaded) {
        setTimeLeft('Loaded');
        setProgress(0); // Or some indicator it's stopped
        setStatus('valid'); // Or a specific 'loaded' status
        return; // Stop timer if loaded
    }

    const calculateTimeLeft = () => {
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
        clearInterval(timer);
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
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer); // Cleanup on unmount or when expiryDate/isLoaded changes
  }, [expiryDate, isLoaded]);


  const getProgressColor = () => {
     if (isLoaded) return 'bg-gray-400'; // Grey if loaded
     switch (status) {
        case 'expired': return 'bg-red-500';
        case 'warning': return 'bg-yellow-500';
        default: return 'bg-green-500'; // Use green instead of primary for better status indication
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

// Quiz Component (Simple Example)
const StatusQuiz: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const questions = [
    { question: "Is the truck loaded and ready for dispatch?", answer: true },
    { question: "Has the pre-check expired?", answer: false }, // Assuming confirmation means it's NOT expired or loading stops it
  ];
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);

  const handleAnswer = (answer: boolean) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz finished, check answers
      const correct = newAnswers.every((ans, index) => ans === questions[index].answer);
      if (correct) {
        onConfirm(); // Call the confirmation callback
        setShowQuiz(false); // Close the quiz dialog
         setAnswers([]); // Reset for next time
         setCurrentQuestionIndex(0);
      } else {
        alert("Incorrect answers. Please review the status."); // Provide feedback
         // Optionally reset or allow retry
         setAnswers([]);
         setCurrentQuestionIndex(0);
         // Keep quiz open or provide specific feedback
      }
    }
  };

   const handleOpenChange = (open: boolean) => {
       setShowQuiz(open);
       if (!open) {
           // Reset quiz state if dialog is closed without finishing
           setAnswers([]);
           setCurrentQuestionIndex(0);
       }
   };

  return (
     <AlertDialog open={showQuiz} onOpenChange={handleOpenChange}>
       <AlertDialogTrigger asChild>
         <Button variant="outline" size="sm">Confirm Status</Button>
       </AlertDialogTrigger>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>Status Confirmation Quiz</AlertDialogTitle>
           <AlertDialogDescription>
              Please answer the following questions to confirm the truck's status.
           </AlertDialogDescription>
         </AlertDialogHeader>
          {currentQuestionIndex < questions.length && (
            <div className="my-4 space-y-4">
                <p>{questions[currentQuestionIndex].question}</p>
                <div className="flex justify-around">
                    <Button onClick={() => handleAnswer(true)}>Yes</Button>
                    <Button variant="destructive" onClick={() => handleAnswer(false)}>No</Button>
                </div>
            </div>
          )}
         <AlertDialogFooter>
           <AlertDialogCancel onClick={() => {setAnswers([]); setCurrentQuestionIndex(0);}}>Cancel</AlertDialogCancel>
           {/* Action button removed as logic is handled within the quiz */}
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
       setLogs(initialLogs); // Update logs when initialLogs prop changes
   }, [initialLogs]);

   const handleMarkLoaded = async (logId: string) => {
      setIsLoading(prev => ({ ...prev, [logId]: true }));
      try {
          const result = await updateTruckLogAction(logId, { isLoaded: true });
          if ('error' in result) {
              toast({ variant: "destructive", title: "Error", description: result.error });
          } else {
              setLogs(prevLogs => prevLogs.map(log => log.id === logId ? { ...log, isLoaded: true } : log));
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
      {logs.map((log) => (
        <Card key={log.id} className="shadow-md">
          <CardHeader className="pb-3">
             <div className="flex justify-between items-start">
                 <div>
                    <CardTitle className="flex items-center text-xl"><Truck className="mr-2 h-5 w-5 text-primary" /> {log.truckNumber}</CardTitle>
                    <CardDescription>Permit: <Badge variant="secondary">{log.permitNumber}</Badge></CardDescription>
                 </div>
                 <Badge variant={log.isLoaded ? "default": log.isPreChecked && log.expiryDate && new Date() > log.expiryDate ? "destructive" : log.isPreChecked ? "outline" : "secondary"} className="whitespace-nowrap">
                   {log.isLoaded ? "Loaded" : log.isPreChecked && log.expiryDate && new Date() > log.expiryDate ? "Expired" : log.isPreChecked ? "Pre-Checked" : "Pending Pre-Check"}
                </Badge>
             </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                 <div className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Date:</strong> <span className="ml-1">{format(log.date, 'PPP')}</span></div>
                <div className="flex items-center"><Package className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Product:</strong> <span className="ml-1">{log.product}</span></div>
                <div className="flex items-center"><Building className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Company:</strong> <span className="ml-1">{log.company}</span></div>
                 {log.isPreChecked && log.preCheckDate && (
                     <div className="flex items-center"><Clock className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Pre-Checked:</strong> <span className="ml-1">{format(log.preCheckDate, 'PPP HH:mm')}</span></div>
                 )}
             </div>

             {log.isPreChecked && log.expiryDate && (
                <ExpiryCountdown expiryDate={log.expiryDate} isLoaded={log.isLoaded} />
             )}

             {!log.isLoaded && log.isPreChecked && log.expiryDate && new Date() < log.expiryDate && (
                <div className="flex items-center gap-2 pt-2">
                   <Button
                       size="sm"
                       onClick={() => handleMarkLoaded(log.id)}
                       disabled={isLoading[log.id]}
                       className="bg-accent hover:bg-accent/90"
                    >
                       {isLoading[log.id] ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                       Mark as Loaded
                   </Button>
                   {/* Add Quiz Confirmation */}
                    <StatusQuiz onConfirm={() => handleMarkLoaded(log.id)} />
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
               {log.isPreChecked && log.expiryDate && new Date() > log.expiryDate && !log.isLoaded && (
                 <div className="flex items-center text-red-600 dark:text-red-400 pt-2">
                     <XCircle className="mr-2 h-4 w-4" /> Pre-check has expired. Cannot mark as loaded.
                 </div>
             )}

          </CardContent>
        </Card>
      ))}
    </div>
  );
}
