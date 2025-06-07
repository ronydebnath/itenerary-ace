
"use client";

import * as React from 'react';
import type { ItineraryItem, Traveler, CurrencyCode } from '@/types/itinerary';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Added cn for FormField

export interface BaseItemFormProps<T extends ItineraryItem> {
  item: T;
  travelers: Traveler[];
  currency: CurrencyCode; // Though not directly used in Base, specific forms might
  onUpdate: (item: T) => void;
  onDelete: () => void;
  children: React.ReactNode; // For specific fields of the item type
  itemTypeLabel: string;
}

export function BaseItemForm<T extends ItineraryItem>({
  item,
  travelers,
  onUpdate,
  onDelete,
  children,
  itemTypeLabel,
}: BaseItemFormProps<T>) {
  const [isOptOutOpen, setIsOptOutOpen] = React.useState(item.excludedTravelerIds.length > 0);

  const handleInputChange = (field: keyof T, value: any) => {
    onUpdate({ ...item, [field]: value });
  };

  const handleOptOutChange = (travelerId: string, checked: boolean) => {
    let newExcludedIds;
    if (checked) {
      newExcludedIds = [...item.excludedTravelerIds, travelerId];
    } else {
      newExcludedIds = item.excludedTravelerIds.filter(id => id !== travelerId);
    }
    onUpdate({ ...item, excludedTravelerIds: newExcludedIds });
  };

  return (
    <Card className="mb-4 shadow-sm border border-border hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor={`itemName-${item.id}`}>{itemTypeLabel} Name</Label>
            <Input
              id={`itemName-${item.id}`}
              value={item.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={`e.g., ${itemTypeLabel} Details`}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`itemNote-${item.id}`}>Note (Optional)</Label>
            <Input
              id={`itemNote-${item.id}`}
              value={item.note || ''}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder="e.g., Specific details or reminders"
            />
          </div>
        </div>

        {children}

        <div className="pt-2">
          <button
            onClick={() => setIsOptOutOpen(!isOptOutOpen)}
            className="flex items-center justify-between w-full text-sm font-medium text-left text-foreground/80 hover:text-primary py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
          >
            <span>Exclude Specific Travelers</span>
            {isOptOutOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {isOptOutOpen && (
            <div className="mt-2 p-3 border rounded-md bg-muted/30 max-h-48 overflow-y-auto">
              {travelers.length > 0 ? (
                travelers.map(traveler => (
                  <div key={traveler.id} className="flex items-center space-x-2 mb-1 py-1">
                    <Checkbox
                      id={`optout-${item.id}-${traveler.id}`}
                      checked={item.excludedTravelerIds.includes(traveler.id)}
                      onCheckedChange={(checked) => handleOptOutChange(traveler.id, !!checked)}
                    />
                    <Label htmlFor={`optout-${item.id}-${traveler.id}`} className="text-sm font-normal cursor-pointer">
                      {traveler.label}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No travelers defined.</p>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-3">
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Delete {itemTypeLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper for specific item forms to create controlled inputs
export const FormField: React.FC<{label: string, id: string, children: React.ReactNode, className?: string}> = ({label, id, children, className}) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id}>{label}</Label>
    {children}
  </div>
);
