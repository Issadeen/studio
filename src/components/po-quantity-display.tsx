'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { getPOQuantitiesAction, updatePOQuantitiesAction } from '@/lib/actions';
import type { POQuantities } from '@/lib/types';

export function POQuantityDisplay() {
  const [quantities, setQuantities] = useState<POQuantities | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedPms, setEditedPms] = useState<number | string>('');
  const [editedAgo, setEditedAgo] = useState<number | string>('');
  const { toast } = useToast();

  useEffect(() => {
    async function fetchQuantities() {
      setIsLoading(true);
      try {
        const result = await getPOQuantitiesAction();
        if ('error' in result) {
          toast({ variant: "destructive", title: "Error", description: result.error });
          setQuantities(null);
        } else {
          setQuantities(result);
          setEditedPms(result.pms); // Initialize edit fields
          setEditedAgo(result.ago);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch PO quantities." });
        setQuantities(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuantities();
  }, [toast]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    const pmsValue = Number(editedPms);
    const agoValue = Number(editedAgo);

    if (isNaN(pmsValue) || pmsValue < 0 || isNaN(agoValue) || agoValue < 0) {
      toast({ variant: "destructive", title: "Invalid Input", description: "Quantities must be non-negative numbers." });
      setIsUpdating(false);
      return;
    }

    try {
      const result = await updatePOQuantitiesAction({ pms: pmsValue, ago: agoValue });
       if ('error' in result) {
          toast({ variant: "destructive", title: "Update Error", description: result.error });
        } else {
          setQuantities(result);
          toast({ title: "Success", description: "PO Quantities updated." });
          setEditMode(false); // Exit edit mode on success
        }
    } catch (error) {
       toast({ variant: "destructive", title: "Update Error", description: "Failed to update PO quantities." });
    } finally {
        setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <Card><CardHeader><CardTitle>Loading PO Quantities...</CardTitle></CardHeader></Card>;
  }

  if (!quantities) {
     return <Card><CardHeader><CardTitle>Could not load PO Quantities</CardTitle></CardHeader></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>PO Quantities (Admin)</CardTitle>
            {!editMode && (
                 <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Edit</Button>
            )}
        </div>
        <CardDescription>Current Purchase Order balances.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {editMode ? (
            <div className="space-y-4">
                <div>
                    <Label htmlFor="pms-qty">PMS Quantity (Litres)</Label>
                    <Input
                        id="pms-qty"
                        type="number"
                        value={editedPms}
                        onChange={(e) => setEditedPms(e.target.value)}
                        disabled={isUpdating}
                    />
                </div>
                 <div>
                    <Label htmlFor="ago-qty">AGO Quantity (Litres)</Label>
                    <Input
                        id="ago-qty"
                        type="number"
                        value={editedAgo}
                        onChange={(e) => setEditedAgo(e.target.value)}
                        disabled={isUpdating}
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleUpdate} disabled={isUpdating}>
                        {isUpdating && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                     <Button variant="ghost" onClick={() => { setEditMode(false); setEditedPms(quantities.pms); setEditedAgo(quantities.ago); }} disabled={isUpdating}>
                        Cancel
                    </Button>
                </div>
            </div>
        ) : (
             <div className="space-y-2">
                <p><strong>PMS:</strong> {quantities.pms.toLocaleString()} Litres</p>
                <p><strong>AGO:</strong> {quantities.ago.toLocaleString()} Litres</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
