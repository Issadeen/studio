'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { CalendarIcon, Truck, Package, Building, CalendarDays, CheckCircle, XCircle, Hash, Droplet, FileText } from 'lucide-react'; // Added icons

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Added Select
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { addTruckLogAction } from '@/lib/actions';
import { cn } from "@/lib/utils";
import type { TruckLog } from '@/lib/types';

// Updated Zod schema
const formSchema = z.object({
  truckNumber: z.string().min(1, 'Truck number is required'),
  date: z.date({ required_error: "Date is required." }),
  product: z.enum(['PMS', 'AGO'], { required_error: "Product is required." }), // Enum for product
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'), // Coerce to number and validate
  company: z.string().min(1, 'Company name is required'),
  epraNumber: z.string().min(1, 'EPRA number is required'), // Added EPRA number
  isPreChecked: z.boolean().default(false),
  preCheckDate: z.date().optional().nullable(),
}).refine(data => !data.isPreChecked || (data.isPreChecked && data.preCheckDate), {
  message: "Pre-check date is required if pre-checked is selected",
  path: ["preCheckDate"],
});

type TruckLogFormValues = z.infer<typeof formSchema>;

interface TruckLogFormProps {
  onLogAdded: (newLog: TruckLog) => void;
}

export function TruckLogForm({ onLogAdded }: TruckLogFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TruckLogFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      truckNumber: '',
      date: new Date(),
      // product: undefined, // No default for select
      quantity: 0,
      company: '',
      epraNumber: '',
      isPreChecked: false,
      preCheckDate: null,
    },
  });

  const isPreChecked = form.watch("isPreChecked");

   async function onSubmit(values: TruckLogFormValues) {
     setIsSubmitting(true);
     try {
         console.log("Submitting form values:", values);
         // Explicitly create the payload matching the action's expectation
         const payload = {
            truckNumber: values.truckNumber,
            date: values.date,
            product: values.product,
            quantity: values.quantity,
            company: values.company,
            epraNumber: values.epraNumber,
            isPreChecked: values.isPreChecked,
            preCheckDate: values.preCheckDate ? values.preCheckDate : null,
            // Ensure all required fields for the action (excluding generated ones) are present
         };

         const result = await addTruckLogAction(payload);

         console.log("Action result:", result);

         if ('error' in result) {
             toast({
                 variant: "destructive",
                 title: "Error",
                 description: result.error,
             });
         } else {
             toast({
                 title: "Success",
                 description: `Permit ${result.permitNumber} generated for truck ${result.truckNumber}.`,
             });
             onLogAdded(result); // Notify parent component
             form.reset(); // Reset form after successful submission
         }
     } catch (error) {
         console.error("Submission error:", error);
         toast({
             variant: "destructive",
             title: "Submission Error",
             description: "An unexpected error occurred.",
         });
     } finally {
        setIsSubmitting(false);
     }
   }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Truck Number */}
          <FormField
            control={form.control}
            name="truckNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Truck className="mr-2 h-4 w-4" /> Truck Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., KAA 123X" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date */}
           <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                   <FormLabel className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4" /> Date</FormLabel>
                   <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                           <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

          {/* Product Select */}
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Package className="mr-2 h-4 w-4" /> Product</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PMS">PMS</SelectItem>
                    <SelectItem value="AGO">AGO</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Droplet className="mr-2 h-4 w-4" /> Quantity (Litres)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 10000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Company */}
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Building className="mr-2 h-4 w-4" /> Company</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Logistics Inc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* EPRA Number */}
          <FormField
            control={form.control}
            name="epraNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4" /> EPRA Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., EPRA/12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


           {/* Pre-Checked Checkbox */}
          <FormField
            control={form.control}
            name="isPreChecked"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-1 lg:col-span-3"> {/* Adjust span */}
                 <FormControl>
                    <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                        field.onChange(checked);
                        // Reset preCheckDate if unchecked
                        if (!checked) {
                         form.setValue("preCheckDate", null);
                        }
                     }}
                    />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center">
                     {field.value ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <XCircle className="mr-2 h-4 w-4 text-red-500" />}
                    Pre-Checked
                  </FormLabel>
                  <FormDescription>
                    Indicates if the truck has undergone pre-checking procedures.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

           {/* Pre-Check Date (Conditional) */}
            {isPreChecked && (
                <FormField
                    control={form.control}
                    name="preCheckDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Pre-Check Date & Time</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value ? (
                                format(field.value, "PPP HH:mm") // Include time
                                ) : (
                                <span>Pick pre-check date & time</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                             <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={(date) => {
                                    // Set date, default time to now if not set yet
                                    const selectedDate = date || new Date();
                                    const currentTime = field.value || new Date();
                                    const newDateTime = new Date(
                                        selectedDate.getFullYear(),
                                        selectedDate.getMonth(),
                                        selectedDate.getDate(),
                                        currentTime.getHours(),
                                        currentTime.getMinutes()
                                    );
                                    field.onChange(newDateTime);
                                }}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            {/* Time Picker */}
                            <div className="p-2 border-t flex justify-center gap-2">
                                <Input
                                    type="time"
                                    value={field.value ? format(field.value, "HH:mm") : ""}
                                    onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':').map(Number);
                                        const currentVal = field.value || new Date(); // Use current date if no date picked yet
                                        const newDate = new Date(currentVal);
                                        newDate.setHours(hours, minutes);
                                        field.onChange(newDate);
                                    }}
                                    className="w-auto"
                                />
                            </div>
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            )}
        </div>


        <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90" disabled={isSubmitting}>
          {isSubmitting ? 'Generating Permit...' : 'Generate Permit & Add Log'}
        </Button>
      </form>
    </Form>
  );
}
