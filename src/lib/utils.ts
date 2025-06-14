
/**
 * @fileoverview This file contains common utility functions used throughout the application.
 * It includes functions for class name concatenation (cn), currency formatting, and GUID generation.
 *
 * @bangla এই ফাইলটিতে অ্যাপ্লিকেশন জুড়ে ব্যবহৃত সাধারণ ইউটিলিটি ফাংশন রয়েছে।
 * এটিতে ক্লাস নাম একত্রীকরণ (cn), মুদ্রা বিন্যাসকরণ এবং জিইউআইডি তৈরির ফাংশন অন্তর্ভুক্ত রয়েছে।
 */
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CurrencyCode } from "@/types/itinerary";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'THB', precision?: number): string {
  try {
    const minDigits = precision !== undefined ? precision : 2;
    const maxDigits = precision !== undefined ? precision : 2;
    return new Intl.NumberFormat(undefined, { 
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
    }).format(amount);
  } catch (error) {
    // Fallback for environments where Intl might not support the currency or other issues
    // console.warn(`Currency formatting error for ${currencyCode}, falling back. Error: ${error}`);
    return `${currencyCode} ${amount.toFixed(precision !== undefined ? precision : 2)}`;
  }
}

export function generateGUID(): string {
  return crypto.randomUUID();
}
