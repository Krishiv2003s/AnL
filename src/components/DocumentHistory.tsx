import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Clock, 
  ChevronRight, 
  Trash2, 
  Loader2,
  FileSpreadsheet,
  Receipt,
  Building2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  status: string;
  created_at: string;
  file_size: number | null;
}

interface DocumentHistoryProps {
  documents: Document[];
  onSelectDocument: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  selectedDocumentId: string | null;
  isLoading: boolean;
}

const documentTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  bank_statement: { icon: FileSpreadsheet, label: "Bank Statement", color: "text-info" },
  form_16: { icon: Receipt, label: "Form 16", color: "text-primary" },
  ledger: { icon: Building2, label: "Business Ledger", color: "text-warning" },
  tax_return: { icon: FileText, label: "Tax Return", color: "text-profit" },
  other: { icon: FileText, label: "Other", color: "text-muted-foreground" },
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export function DocumentHistory({
  documents,
  onSelectDocument,
  onDeleteDocument,
  selectedDocumentId,
  isLoading,
}: DocumentHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDeleteDocument(id);
    setDeletingId(null);
  };

  if (isLoading) {
    return (
      <div className="ticker-card p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-mono text-muted-foreground">LOADING HISTORY...</span>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="ticker-card p-6 text-center">
        <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm font-mono text-muted-foreground">NO DOCUMENTS YET</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Upload your first document to begin</p>
      </div>
    );
  }

  return (
    <div className="ticker-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm uppercase tracking-wider">Document History</span>
          </div>
          <Badge variant="secondary" className="font-mono text-xs">
            {documents.length} FILES
          </Badge>
        </div>
      </div>

      {/* Document List */}
      <div className="max-h-[400px] overflow-y-auto">
        {documents.map((doc) => {
          const typeConfig = documentTypeConfig[doc.document_type] || documentTypeConfig.other;
          const Icon = typeConfig.icon;
          const isSelected = selectedDocumentId === doc.id;
          const isAnalyzed = doc.status === "analyzed";

          return (
            <div
              key={doc.id}
              className={`group p-4 border-b border-border/20 cursor-pointer transition-all hover:bg-secondary/30 ${
                isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""
              }`}
              onClick={() => onSelectDocument(doc.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isAnalyzed ? "bg-profit/10" : "bg-warning/10"
                  }`}>
                    {isAnalyzed ? (
                      <CheckCircle2 className="h-5 w-5 text-profit" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-warning" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.file_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="secondary" className="font-mono text-[10px] px-1.5">
                        {typeConfig.label}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isAnalyzed ? "success" : "warning"} 
                    className="font-mono text-[10px]"
                  >
                    {isAnalyzed ? "ANALYZED" : "PENDING"}
                  </Badge>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-loss/10 hover:text-loss"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{doc.file_name}"? This will also remove all analysis results.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(doc.id)}
                          className="bg-loss text-loss-foreground hover:bg-loss/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90 text-primary" : ""}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}