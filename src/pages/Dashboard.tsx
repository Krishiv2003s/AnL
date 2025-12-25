import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { AccountsTable } from "@/components/AccountsTable";
import { InsightsPanel } from "@/components/InsightsPanel";
import { BalanceSheetSummary } from "@/components/BalanceSheetSummary";
import { DocumentHistory } from "@/components/DocumentHistory";
import { TaxComparison } from "@/components/TaxComparison";
import { IncomeExpenseChart } from "@/components/IncomeExpenseChart";
import { AdBannerPlaceholder } from "@/components/AdBanner";
import { AnalysisLoadingSkeleton } from "@/components/AnalysisSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getSafeErrorMessage } from "@/lib/errorHandler";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { Loader2, TrendingUp, Activity } from "lucide-react";

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  status: string;
  created_at: string;
  file_size: number | null;
}

export default function Dashboard() {
  const { user, profile, refetchProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    if (!user) return;

    // Frontend safety check for free users
    const usageCount = profile?.lifetime_docs_analyzed || 0;
    const historyCount = documents.length;
    const isPro = profile?.subscription_status === 'active';

    // Check both profile count and history count for robustness
    if (!isPro && (usageCount >= 1 || historyCount >= 1)) {
      setIsSubscriptionModalOpen(true);
      toast({
        title: "Limit Reached",
        description: "You've used your free analysis. Upgrade to Pro for unlimited access.",
        variant: "default",
      });
      return;
    }

    setIsUploading(true);
    setSelectedDocumentId(null);
    setAnalysisResult(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64Content = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const { data: docData, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: `${user.id}/${file.name}`,
          file_type: file.type || "application/octet-stream",
          document_type: documentType as any,
          file_size: file.size,
          status: "pending",
        })
        .select()
        .single();

      if (docError) throw docError;

      // Force session refresh before calling edge function to prevent JWT expiry
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const { data, error } = await supabase.functions.invoke("analyze-document", {
        body: {
          documentContent: base64Content,
          documentType,
          fileName: file.name,
          isBase64: true,
          mimeType: file.type || "application/pdf",
        },
      });

      if (error) throw error;

      await supabase
        .from("documents")
        .update({ status: "analyzed" })
        .eq("id", docData.id);

      if (data?.accounts) {
        const accountsToInsert = data.accounts.map((acc: any) => ({
          document_id: docData.id,
          user_id: user.id,
          account_name: acc.account_name,
          category: acc.category,
          total_credit: acc.total_credit || 0,
          total_debit: acc.total_debit || 0,
          net_balance: acc.net_balance || 0,
          is_taxable: acc.is_taxable || false,
          classification: acc.classification || "neutral",
          tax_implications: acc.tax_implications,
        }));

        await supabase.from("categorized_accounts").insert(accountsToInsert);
      }

      if (data?.insights) {
        const insightsToInsert = data.insights.map((insight: any) => ({
          document_id: docData.id,
          user_id: user.id,
          insight_type: insight.insight_type,
          severity: insight.severity,
          title: insight.title,
          description: insight.description,
          recommendation: insight.recommendation,
          itr_form_suggestion: insight.itr_form_suggestion,
        }));

        await supabase.from("analysis_insights").insert(insightsToInsert);
      }

      setAnalysisResult(data);
      setSelectedDocumentId(docData.id);
      await fetchDocuments();
      await refetchProfile();

      toast({
        title: "Analysis Complete",
        description: "Your document has been analyzed successfully.",
      });
    } catch (error: any) {
      if (error?.message?.includes('Free limit reached') || error?.code === 'PAYMENT_REQUIRED' || error?.is_limit_reached) {
        setIsSubscriptionModalOpen(true);
        toast({
          title: "Limit Reached",
          description: "You've used your free analysis. Upgrade to continue.",
          variant: "default",
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: getSafeErrorMessage(error, "analyze document"),
          variant: "destructive",
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectDocument = async (documentId: string) => {
    if (selectedDocumentId === documentId) {
      setSelectedDocumentId(null);
      setAnalysisResult(null);
      return;
    }

    setSelectedDocumentId(documentId);

    try {
      const { data: accounts, error: accError } = await supabase
        .from("categorized_accounts")
        .select("*")
        .eq("document_id", documentId);

      if (accError) throw accError;

      const { data: insights, error: insError } = await supabase
        .from("analysis_insights")
        .select("*")
        .eq("document_id", documentId);

      if (insError) throw insError;

      const totalAssets = accounts
        ?.filter((a) => a.classification === "asset")
        .reduce((sum, a) => sum + Number(a.net_balance), 0) || 0;

      const totalLiabilities = accounts
        ?.filter((a) => a.classification === "liability")
        .reduce((sum, a) => sum + Math.abs(Number(a.net_balance)), 0) || 0;

      const itrSuggestion = insights?.find((i) => i.itr_form_suggestion)?.itr_form_suggestion || "ITR-1";

      setAnalysisResult({
        accounts: accounts?.map((a) => ({
          account_name: a.account_name,
          category: a.category,
          total_credit: Number(a.total_credit),
          total_debit: Number(a.total_debit),
          net_balance: Number(a.net_balance),
          is_taxable: a.is_taxable,
          classification: a.classification,
          tax_implications: a.tax_implications,
        })),
        insights: insights?.map((i) => ({
          insight_type: i.insight_type,
          severity: i.severity as "error" | "warning" | "info",
          title: i.title,
          description: i.description,
          recommendation: i.recommendation,
          itr_form_suggestion: i.itr_form_suggestion,
        })),
        summary: {
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          net_worth: totalAssets - totalLiabilities,
          primary_income_source: "Various",
          recommended_itr_form: itrSuggestion,
          tax_regime_suggestion: "New Regime",
        },
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getSafeErrorMessage(error, "load document analysis"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      if (selectedDocumentId === documentId) {
        setSelectedDocumentId(null);
        setAnalysisResult(null);
      }

      fetchDocuments();

      toast({
        title: "Document Deleted",
        description: "The document and its analysis have been removed.",
      });
    } catch (error: unknown) {
      toast({
        title: "Delete Failed",
        description: getSafeErrorMessage(error, "delete document"),
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background grid-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-mono text-sm">Loading market data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid-bg">
      <Header />
      <main className="container pt-24 pb-12">
        {/* Top Banner Ad */}
        <AdBannerPlaceholder className="h-20 mb-6" />

        {/* Hero Section with Market-like Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-mono text-primary">LIVE ANALYSIS</span>
          </div>
          <h1 className="font-display text-4xl font-bold mb-2 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Financial Terminal
          </h1>
          <p className="text-muted-foreground">
            AI-powered tax analysis • Real-time insights • Smart recommendations
          </p>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto">
          {/* Centered Upload Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <FileUpload onFileSelect={handleFileUpload} isUploading={isUploading} />
          </div>

          {/* Document History Row */}
          <div className="mb-8">
            <DocumentHistory
              documents={documents}
              onSelectDocument={handleSelectDocument}
              onDeleteDocument={handleDeleteDocument}
              selectedDocumentId={selectedDocumentId}
              isLoading={loadingDocs}
            />
          </div>

          {/* Analysis Results Section */}
          {isUploading ? (
            <AnalysisLoadingSkeleton />
          ) : analysisResult ? (
            <div className="space-y-8 animate-fade-in">
              {/* Balance Sheet Summary with Stock Ticker Style */}
              {analysisResult?.summary && (
                <BalanceSheetSummary summary={analysisResult.summary} />
              )}

              {/* Income vs Expense Charts */}
              {analysisResult?.accounts && analysisResult.accounts.length > 0 && (
                <IncomeExpenseChart accounts={analysisResult.accounts} />
              )}

              {/* Accounts Table */}
              {analysisResult?.accounts && analysisResult.accounts.length > 0 && (
                <AccountsTable accounts={analysisResult.accounts} />
              )}

              {/* Tax Comparison */}
              {analysisResult?.accounts && analysisResult.accounts.length > 0 && (
                <TaxComparison
                  totalIncome={
                    analysisResult.accounts
                      .filter((a: any) => a.category === "salary" || a.category === "income")
                      .reduce((sum: number, a: any) => sum + Math.abs(a.net_balance), 0) ||
                    analysisResult.summary?.total_assets ||
                    500000
                  }
                  salaryIncome={
                    analysisResult.accounts
                      .filter((a: any) => a.category === "salary")
                      .reduce((sum: number, a: any) => sum + Math.abs(a.net_balance), 0)
                  }
                />
              )}

              {/* Insights Panel */}
              {analysisResult?.insights && analysisResult.insights.length > 0 && (
                <InsightsPanel insights={analysisResult.insights} />
              )}
            </div>
          ) : (
            <div className="ticker-card p-12 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground font-mono">
                {documents.length > 0
                  ? "SELECT A DOCUMENT TO VIEW ANALYSIS"
                  : "UPLOAD A DOCUMENT TO BEGIN ANALYSIS"}
              </p>
              <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground/50">
                <span>• Bank Statements</span>
                <span>• Form 16</span>
                <span>• Ledgers</span>
                <span>• Tax Returns</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Banner Ad */}
        <AdBannerPlaceholder className="h-20 mt-8" />

        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
        />
      </main>
    </div>
  );
}