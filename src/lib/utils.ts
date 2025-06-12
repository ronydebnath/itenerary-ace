
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CurrencyCode } from "@/types/itinerary";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'THB'): string {
  try {
    return new Intl.NumberFormat(undefined, { 
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function generateGUID(): string {
  return crypto.randomUUID();
}

