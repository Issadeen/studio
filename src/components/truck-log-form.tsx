'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { CalendarIcon, Truck, Package, Building, CalendarDays, CheckCircle, XCircle, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
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

const formSchema = z.object({
  truckNumber: z.string().min(1, 'Truck number is required'),
  date: z.date({ required_error: "Date is required." }),
  product: z.string().min(1, 'Product name is required'),
  company: z.string().min(1, 'Company name is required'),
  isPreChecked: z.boolean().default(false),
  preCheckDate: z.date().optional().nullable(),
}).refine(data => !data.isPreChecked || (data.isPreChecked && data.preCheckDate), {
  message: "Pre-check date is required if pre-checked is selected",
  path: ["preCheckDate"], // Field to display the error message under
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
      product: '',
      company: '',
      isPreChecked: false,
      preCheckDate: null,
    },
  });

  const isPreChecked = form.watch("isPreChecked");

   async function onSubmit(values: TruckLogFormValues) {
     setIsSubmitting(true);
     try {
         console.log("Submitting form values:", values);
         const result = await addTruckLogAction({
             ...values,
             // Ensure date types are correct if necessary, though they should be Date objects from react-hook-form
             date: values.date,
             preCheckDate: values.preCheckDate ? values.preCheckDate : null,
         });

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Truck Number */}
          <FormField
            control={form.control}
            name="truckNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Truck className="mr-2 h-4 w-4" /> Truck Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TRUCK123" {...field} />
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

          {/* Product */}
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Package className="mr-2 h-4 w-4" /> Product</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Electronics" {...field} />
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

           {/* Pre-Checked Checkbox */}
          <FormField
            control={form.control}
            name="isPreChecked"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
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
                        <FormLabel className="flex items-center"><CalendarDays className="mr-2 h-4 w-4" /> Pre-Check Date</FormLabel>
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
                                format(field.value, "PPP HH:mm") // Include time if needed
                                ) : (
                                <span>Pick pre-check date</span>
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
                                    // Set date with current time if only date is picked
                                    const now = new Date();
                                    const selectedDateWithTime = date ? new Date(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        date.getDate(),
                                        now.getHours(),
                                        now.getMinutes(),
                                        now.getSeconds()
                                    ) : null;
                                    field.onChange(selectedDateWithTime);
                                }}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            {/* Simple Time Picker - replace with a better component if needed */}
                            {field.value && (
                                <div className="p-2 border-t flex justify-center gap-2">
                                    <Input
                                        type="time"
                                        value={format(field.value, "HH:mm")}
                                        onChange={(e) => {
                                            const [hours, minutes] = e.target.value.split(':').map(Number);
                                            const newDate = new Date(field.value!);
                                            newDate.setHours(hours, minutes);
                                            field.onChange(newDate);
                                        }}
                                        className="w-auto"
                                    />
                                </div>
                            )}
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
