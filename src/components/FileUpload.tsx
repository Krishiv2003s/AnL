import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File, documentType: string) => void;
  isUploading: boolean;
}

const documentTypes = [
  { value: "bank_statement", label: "Bank Statement" },
  { value: "form_16", label: "Form 16 / TDS Certificate" },
  { value: "ledger", label: "Business Ledger" },
  { value: "tax_return", label: "Previous Tax Return" },
  { value: "other", label: "Other Document" },
];

export function FileUpload({ onFileSelect, isUploading }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [error, setError] = useState<string>("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError("");
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const isValidType = 
        file.type === "application/pdf" ||
        file.type === "application/vnd.ms-excel" ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.name.endsWith(".csv");

      if (!isValidType) {
        setError("Please upload a PDF, Excel (.xlsx, .xls), or CSV file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleUpload = () => {
    if (selectedFile && documentType) {
      onFileSelect(selectedFile, documentType);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError("");
  };

  return (
    <div className="ticker-card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Upload Document</h3>
              <p className="text-sm text-muted-foreground">
                Bank statements, Form 16, or business ledgers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-primary">AI POWERED</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Document Type Selector */}
        <div className="space-y-2">
          <label className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
            Document Type
          </label>
          <Select value={documentType} onValueChange={setDocumentType} disabled={isUploading}>
            <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "relative rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border/50 hover:border-primary/50 hover:bg-secondary/30",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />

          {selectedFile ? (
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-profit/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-profit" />
              </div>
              <div className="text-left">
                <p className="font-mono font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                disabled={isUploading}
                className="hover:bg-loss/10 hover:text-loss"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-xl bg-secondary/50 flex items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium mb-1">
                  {isDragActive ? "Drop your file here" : "Drag & drop your file"}
                </p>
                <p className="text-sm text-muted-foreground font-mono">
                  or click to browse • PDF, Excel, CSV up to 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-loss">
            <div className="w-2 h-2 rounded-full bg-loss" />
            {error}
          </div>
        )}

        {/* Upload button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !documentType || isUploading}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-mono uppercase tracking-wider"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Document...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Analyze with AI
            </>
          )}
        </Button>
      </div>
    </div>
  );
}