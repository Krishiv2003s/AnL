import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Trash2, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ITRFileUploadProps {
    title: string;
    description: string;
    allowedTypes: string[];
    isUploading: boolean;
    onChange: (files: { file: File; type: string; id: string }[]) => void;
    maxFiles?: number;
}

const allDocumentTypes = [
    { value: "itr_json", label: "ITR (JSON Format)" },
    { value: "itr_pdf", label: "ITR (PDF Copy)" },
    { value: "itr_coi", label: "ITR Computation (COI)" },
    { value: "ais", label: "AIS (Annual Info Statement)" },
    { value: "form_26as", label: "Form 26AS" },
    { value: "bank_statement", label: "Bank Interest Statement" },
    { value: "previous_itr", label: "Previous Year ITR" },
];

export function ITRFileUpload({
    title,
    description,
    allowedTypes,
    isUploading,
    onChange,
    maxFiles = 10,
}: ITRFileUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState<string>("");
    const [localFiles, setLocalFiles] = useState<{ file: File; type: string; id: string }[]>([]);
    const [error, setError] = useState<string>("");

    const filteredTypes = allDocumentTypes.filter((t) => allowedTypes.includes(t.value));

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
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
        },
        [isUploading]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
            "application/json": [".json"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        },
        maxFiles: 1,
        disabled: isUploading || localFiles.length >= maxFiles,
    });

    const addFile = () => {
        if (selectedFile && documentType) {
            let nextFiles;
            const existingIndex = localFiles.findIndex((f) => f.type === documentType);

            if (existingIndex !== -1) {
                nextFiles = [...localFiles];
                nextFiles[existingIndex] = { file: selectedFile, type: documentType, id: Date.now().toString() };
            } else {
                nextFiles = [...localFiles, { file: selectedFile, type: documentType, id: Date.now().toString() }];
            }

            setLocalFiles(nextFiles);
            onChange(nextFiles);
            setSelectedFile(null);
            setDocumentType("");
        }
    };

    const removeFile = (id: string) => {
        const nextFiles = localFiles.filter((f) => f.id !== id);
        setLocalFiles(nextFiles);
        onChange(nextFiles);
    };

    const clearSelected = () => {
        setSelectedFile(null);
        setError("");
    };

    return (
        <div className="ticker-card overflow-hidden h-full">
            <div className="p-5 border-b border-border/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-display text-sm font-bold uppercase tracking-wider">{title}</h3>
                        <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* List of successfully uploaded files */}
                {localFiles.length > 0 && (
                    <div className="space-y-2">
                        <div className="grid gap-2">
                            {localFiles.map((fileItem) => {
                                const typeLabel =
                                    allDocumentTypes.find((t) => t.value === fileItem.type)?.label || fileItem.type;
                                return (
                                    <div
                                        key={fileItem.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/50 group"
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="h-4 w-4 text-primary shrink-0" />
                                            <div className="overflow-hidden">
                                                <p className="text-[11px] font-bold truncate">{fileItem.file.name}</p>
                                                <p className="text-[9px] text-primary/70 font-mono uppercase">
                                                    {typeLabel}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFile(fileItem.id)}
                                            className="h-7 w-7 text-muted-foreground hover:text-loss transition-colors"
                                            disabled={isUploading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {localFiles.length < maxFiles ? (
                    <div className="space-y-3 pt-2">
                        <div className="space-y-1.5">
                            <Select value={documentType} onValueChange={setDocumentType} disabled={isUploading}>
                                <SelectTrigger className="h-9 bg-secondary/50 border-border/50 focus:border-primary text-xs">
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredTypes.map((type) => (
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
                                "relative rounded-lg border-2 border-dashed p-4 text-center transition-all cursor-pointer",
                                isDragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-border/50 hover:border-primary/50 hover:bg-secondary/30",
                                (isUploading || localFiles.length >= maxFiles) && "pointer-events-none opacity-50"
                            )}
                        >
                            <input {...getInputProps()} />

                            {selectedFile ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-8 h-8 rounded bg-profit/10 flex items-center justify-center shrink-0">
                                        <FileText className="h-4 w-4 text-profit" />
                                    </div>
                                    <div className="text-left overflow-hidden flex-1">
                                        <p className="text-[11px] font-bold truncate">{selectedFile.name}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearSelected();
                                        }}
                                        disabled={isUploading}
                                        className="h-7 w-7 hover:bg-loss/10 hover:text-loss"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium">Click to upload</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">PDF, JSON, Excel</p>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={addFile}
                            disabled={!selectedFile || !documentType || isUploading}
                            variant="secondary"
                            className="w-full h-9 font-mono text-[10px] uppercase tracking-widest"
                        >
                            Add Document
                        </Button>

                        {title.includes("1.") && (
                            <p className="text-[9px] text-muted-foreground italic bg-secondary/20 p-2 rounded border border-border/30">
                                <span className="text-primary font-bold not-italic">TIP:</span> For maximum accuracy, please upload both your <span className="font-bold">ITR</span> (JSON/PDF) and its <span className="font-bold">Computation (COI)</span> file.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="p-3 rounded-lg bg-profit/5 border border-profit/20 text-center">
                        <CheckCircle2 className="h-5 w-5 text-profit mx-auto mb-1" />
                        <p className="text-[10px] font-mono text-profit">Maximum documents reached</p>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 text-[10px] text-loss font-mono p-2 rounded bg-loss/5">
                        <AlertTriangle className="h-3 w-3" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
