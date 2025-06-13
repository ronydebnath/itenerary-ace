
"use client";

import * as React from 'react';
import { useFormContext } from "react-hook-form";
import type { ServicePriceFormValues } from '../ServicePriceFormRouter';
import type { ParseActivityTextOutput } from '@/types/ai-contract-schemas'; // Assuming ParseActivityTextOutput is the correct type
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { parseActivityText } from '@/ai/flows/parse-activity-text-flow';
import { generateGUID } from '@/lib/utils';

interface ActivityAIParserProps {
  onPrefillData: (data: ParseActivityTextOutput, currency?: string) => void;
}

export function ActivityAIParser({ onPrefillData }: ActivityAIParserProps) {
  const [aiInputText, setAiInputText] = React.useState("");
  const [isParsingWithAI, setIsParsingWithAI] = React.useState(false);
  const [aiParseError, setAiParseError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleParseActivityTextWithAI = async () => {
    if (!aiInputText.trim()) {
      setAiParseError("Please paste some activity description text.");
      return;
    }
    setIsParsingWithAI(true);
    setAiParseError(null);
    try {
      const result = await parseActivityText({ activityText: aiInputText });
      onPrefillData(result, result.parsedPackages?.[0]?.currency);
      setAiInputText(""); // Clear input after successful parse
      toast({ title: "AI Parsing Complete", description: "Review and adjust the prefilled package data below." });
    } catch (error: any) {
      console.error("AI Parsing Error:", error);
      const errorMessage = error.message || "Could not parse text with AI.";
      setAiParseError(`Failed to parse with AI: ${errorMessage}`);
      toast({ title: "AI Parsing Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsParsingWithAI(false);
    }
  };

  return (
    <div className="border border-border rounded-md p-3 sm:p-4 relative mt-4 md:mt-6">
      <p className="text-xs sm:text-sm font-semibold -mt-5 sm:-mt-6 ml-2 px-1 bg-background inline-block absolute left-2 top-[-0.7rem] mb-4 flex items-center">
        <Sparkles className="inline-block mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" /> AI Activity Parser (Optional)
      </p>
      <div className="space-y-2 sm:space-y-3 pt-3">
        <div>
          <Label htmlFor="ai-activity-text-input" className="text-xs sm:text-sm">
            Paste Activity Description (Can include multiple packages)
          </Label>
          <Textarea
            id="ai-activity-text-input"
            value={aiInputText}
            onChange={(e) => setAiInputText(e.target.value)}
            placeholder="e.g., Bangkok City Tour. Option 1: Half day... Adult 1200 THB..."
            rows={4}
            className="mt-1 text-sm"
          />
        </div>

        {aiParseError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-sm">Error</AlertTitle>
            <AlertDescription className="text-xs">{aiParseError}</AlertDescription>
          </Alert>
        )}
        {isParsingWithAI && (
          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <AlertTitle className="text-sm text-blue-700">AI Processing...</AlertTitle>
            <AlertDescription className="text-xs text-blue-600">Extracting details. This may take a moment.</AlertDescription>
          </Alert>
        )}

        <Button
          type="button"
          onClick={handleParseActivityTextWithAI}
          disabled={isParsingWithAI || !aiInputText.trim()}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xs sm:text-sm h-9 sm:h-10"
        >
          {isParsingWithAI ? (
            <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          )}
          Parse with AI & Prefill Packages
        </Button>
      </div>
    </div>
  );
}
