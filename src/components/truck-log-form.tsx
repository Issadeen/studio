'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns";
import { CalendarIcon, Truck, Package, Building, Hash, Droplet, FileText, User, Warehouse } from 'lucide-react'; // Added User, Warehouse icons

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Checkbox } from '@/components/ui/checkbox'; // Removed Checkbox import
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
  // FormDescription, // Removed FormDescription import
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
import type { TruckLog, AddTruckLogInput } from '@/lib/types'; // Import specific types

// Updated Zod schema for adding a log
const formSchema = z.object({
  epapNumber: z.string().min(1, 'EPAP number is required'), // Use EPAP number as the main identifier
  truckNumber: z.string().min(1, 'Truck number is required'),
  date: z.date({ required_error: "Date is required." }),
  product: z.enum(['PMS', 'AGO'], { required_error: "Product is required." }), // Enum for product
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'), // Coerce to number and validate
  company: z.string().min(1, 'Company name is required'),
  owner: z.string().min(1, 'Owner name is required'), // Added owner field
  depot: z.string().min(1, 'Depot name is required'), // Added depot field
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
      epapNumber: '', // Use epapNumber
      truckNumber: '',
      date: new Date(),
      // product: undefined, // No default for select
      quantity: 0,
      company: '',
      owner: '', // Default owner
      depot: '', // Default depot
    },
  });

   async function onSubmit(values: TruckLogFormValues) {
     setIsSubmitting(true);
     try {
         console.log("Submitting form values:", values);
         // Prepare payload matching AddTruckLogInput type
         const payload: AddTruckLogInput = {
            epapNumber: values.epapNumber, // Use epapNumber
            truckNumber: values.truckNumber,
            date: values.date,
            product: values.product,
            quantity: values.quantity,
            company: values.company,
            owner: values.owner, // Include owner
            depot: values.depot, // Include depot
         };

         const result = await addTruckLogAction(payload);

         console.log("Action result:", result);

         if ('error' in result) {
             toast({
                 variant: "destructive",
                 title: "Error Adding Log",
                 description: result.error,
             });
         } else {
             toast({
                 title: "Success",
                 description: `Log added for EPAP ${result.epapNumber}.`, // Update toast message
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

          {/* EPAP Number */}
          <FormField
            control={form.control}
            name="epapNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><FileText className="mr-2 h-4 w-4" /> EPAP Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., EPAP/12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {/* Owner */}
           <FormField
            control={form.control}
            name="owner"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><User className="mr-2 h-4 w-4" /> Owner</FormLabel>
                <FormControl>
                  <Input placeholder="Owner's name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Depot */}
          <FormField
            control={form.control}
            name="depot"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center"><Warehouse className="mr-2 h-4 w-4" /> Depot</FormLabel>
                <FormControl>
                  <Input placeholder="Depot name" {...field} />
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
                   <FormLabel className="flex items-center"><CalendarIcon className="mr-2 h-4 w-4" /> Date Added</FormLabel>
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
                  <Input type="number" placeholder="e.g., 10000" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
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



          {/* Removed Pre-check Checkbox and Date fields */}

        </div>


        <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90" disabled={isSubmitting}>
          {isSubmitting ? 'Adding Log...' : 'Add Truck Log'}
        </Button>
      </form>
    </Form>
  );
}
