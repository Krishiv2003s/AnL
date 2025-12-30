import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, Loader2, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ITRFileUploadProps {
    onFileSelect: (file: File, documentType: string) => void;
    isUploading: boolean;
}

const itrDocumentTypes = [
    { value: "itr_json", label: "ITR (JSON Format)" },
    { value: "itr_pdf", label: "ITR (PDF Copy)" },
    { value: "ais", label: "AIS (Annual Info Statement)" },
    { value: "form_26as", label: "Form 26AS" },
    { value: "bank_statement", label: "Bank Interest Statement" },
    { value: "previous_itr", label: "Previous Year ITR" },
];

export function ITRFileUpload({ onFileSelect, isUploading }: ITRFileUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState<string>("");
    const [error, setError] = useState<string>("");

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setError("");
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            const isValidType =
                file.type === "application/pdf" ||
                file.type === "application/json" ||
                file.name.endsWith(".json") ||
                file.type === "application/vnd.ms-excel" ||
                file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

            if (!isValidType) {
                setError("Please upload a PDF, JSON, or Excel file");
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
            "application/json": [".json"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
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
            <div className="p-6 border-b border-border/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-display text-lg font-semibold">Self-Audit Upload</h3>
                            <p className="text-sm text-muted-foreground">
                                Upload ITR, AIS, or 26AS for verification
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-profit" />
                        <span className="text-xs font-mono text-profit">SECURE & PRIVATE</span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                        Document Category
                    </label>
                    <Select value={documentType} onValueChange={setDocumentType} disabled={isUploading}>
                        <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-primary">
                            <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                            {itrDocumentTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

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
                                <p className="font-mono font-medium truncate max-w-[200px]">{selectedFile.name}</p>
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
                                    or click to browse • PDF, JSON, Excel
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-loss font-mono">
                        <div className="w-2 h-2 rounded-full bg-loss" />
                        {error}
                    </div>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || !documentType || isUploading}
                    className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-mono uppercase tracking-wider"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Logic...
                        </>
                    ) : (
                        <>
                            <Zap className="mr-2 h-4 w-4" />
                            Run Self-Audit
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
