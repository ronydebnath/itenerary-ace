
"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ImageIcon, AlertCircle, Sparkles, LayoutDashboard } from 'lucide-react'; // Changed Home to LayoutDashboard
import { describeImage } from '@/ai/flows/describe-image-flow';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import Link from 'next/link';

export default function ImageDescriberPage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [description, setDescription] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setDescription(null);
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { 
        setError("File size exceeds 4MB limit. Please choose a smaller image.");
        setSelectedFile(null);
        setPreviewUrl(null);
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 4MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !previewUrl) {
      setError("Please select an image file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setDescription(null);

    try {
      const result = await describeImage({ imageDataUri: previewUrl });
      setDescription(result.description);
      toast({
        title: "Description Generated!",
        description: "The AI has successfully described your image.",
      });
    } catch (e: any) {
      console.error("Error describing image:", e);
      const errorMessage = e.message || "An unknown error occurred while describing the image.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center">
          <Link href="/" className="absolute top-4 left-4">
            <Button variant="outline" size="icon">
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </Link>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary mb-4">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">AI Image Describer</CardTitle>
          <CardDescription>Upload an image and let AI tell you what it sees. (Uses OpenRouter Gemma 3)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label htmlFor="image-upload" className="text-lg font-medium">Upload Image</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground mt-1">Max file size: 4MB. Common formats like JPG, PNG, WEBP accepted.</p>
          </div>

          {previewUrl && (
            <div className="mt-4 border border-dashed border-muted-foreground/50 p-2 rounded-md">
              <Image
                src={previewUrl}
                alt="Selected image preview"
                width={600}
                height={400}
                className="rounded-md object-contain max-h-[300px] w-full"
              />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-6 bg-muted/50 rounded-md">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
              <p className="text-lg font-semibold text-primary">AI is analyzing your image...</p>
              <p className="text-sm text-muted-foreground">This might take a few moments.</p>
            </div>
          )}

          {description && !isLoading && (
            <Card className="bg-secondary/30 border-secondary shadow-inner">
              <CardHeader>
                <CardTitle className="text-xl text-accent">AI Generated Description:</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 whitespace-pre-wrap">{description}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || isLoading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <ImageIcon className="mr-2 h-5 w-5" />
            )}
            Describe Image
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
