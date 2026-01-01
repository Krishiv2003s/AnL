import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
    BarChart3,
    Upload,
    Settings2,
    LineChart,
    PieChart,
    Download,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    FileSpreadsheet,
    BrainCircuit,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Step = "upload" | "clean" | "analyze" | "results";

export default function BusinessAnalytics() {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState<Step>("upload");
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const steps: { id: Step; label: string; icon: any }[] = [
        { id: "upload", label: "Upload Data", icon: Upload },
        { id: "clean", label: "Clean & Map", icon: Settings2 },
        { id: "analyze", label: "Run Models", icon: BrainCircuit },
        { id: "results", label: "Insights", icon: BarChart3 },
    ];

    const handleNext = () => {
        if (currentStep === "upload") setCurrentStep("clean");
        else if (currentStep === "clean") setCurrentStep("analyze");
        else if (currentStep === "analyze") setCurrentStep("results");
    };

    const handleBack = () => {
        if (currentStep === "results") setCurrentStep("analyze");
        else if (currentStep === "analyze") setCurrentStep("clean");
        else if (currentStep === "clean") setCurrentStep("upload");
    };

    return (
        <div className="min-h-screen bg-background grid-bg">
            <Header />

            <main className="container pt-24 pb-20">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 font-mono">
                            <BrainCircuit className="h-4 w-4 text-primary" />
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">
                                Next-Gen Business Intelligence
                            </span>
                        </div>
                        <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            Self-Service AI Analytics
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Transform your raw financial data into actionable insights with ML-powered forecasting and segmentation.
                        </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.id;
                            const isPast = steps.findIndex(s => s.id === currentStep) > idx;

                            return (
                                <div key={step.id} className="flex flex-col items-center relative flex-1">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10",
                                        isActive ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" :
                                            isPast ? "bg-profit border-profit text-white" : "bg-background border-border text-muted-foreground"
                                    )}>
                                        {isPast ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                                    </div>
                                    <span className={cn(
                                        "mt-3 text-[10px] font-bold font-mono uppercase tracking-widest",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {step.label}
                                    </span>
                                    {idx < steps.length - 1 && (
                                        <div className={cn(
                                            "absolute top-6 left-1/2 w-full h-[2px] -z-0",
                                            isPast ? "bg-profit" : "bg-border"
                                        )} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Step Content */}
                    <Card className="ticker-card border-border/50 bg-secondary/10 backdrop-blur-sm p-8 min-h-[400px]">
                        {currentStep === "upload" && (
                            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                <div className="w-20 h-20 rounded-2xl bg-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center mb-6">
                                    <Upload className="h-10 w-10 text-primary" />
                                </div>
                                <h2 className="text-2xl font-display font-bold mb-2">Upload Business Documents</h2>
                                <p className="text-muted-foreground mb-8 max-w-md">
                                    Drop your Company Quarter results or Business Ledgers & Statements here. We'll handle the parsing and normalization automatically.
                                </p>
                                <div className="flex gap-4">
                                    <Button size="lg" className="bg-primary hover:bg-primary/90 font-display uppercase tracking-widest font-bold">
                                        Choose PDF / Excel
                                    </Button>
                                    <Button variant="outline" size="lg" className="font-display uppercase tracking-widest font-bold">
                                        See Examples
                                    </Button>
                                </div>
                                <p className="mt-6 text-[10px] font-mono text-muted-foreground uppercase">
                                    Supports: PDF • XLSX • XLS
                                </p>
                            </div>
                        )}

                        {currentStep === "clean" && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <Settings2 className="h-6 w-6 text-primary" />
                                    <div>
                                        <h3 className="text-xl font-bold">Data Normalization</h3>
                                        <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Mapping columns to standard entities</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="p-6 rounded-xl bg-background border border-border/50">
                                        <h4 className="font-mono text-xs font-bold uppercase mb-4 text-primary">Column Mapping</h4>
                                        <div className="space-y-4">
                                            {['Date', 'Revenue/Amount', 'Description', 'Category'].map(label => (
                                                <div key={label} className="flex items-center justify-between p-3 rounded bg-secondary/30">
                                                    <span className="text-sm font-semibold">{label}</span>
                                                    <span className="text-xs font-mono text-muted-foreground italic">Auto-detected ✅</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-xl bg-background border border-border/50">
                                        <h4 className="font-mono text-xs font-bold uppercase mb-4 text-warning">Cleaning Options</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded border-2 border-primary bg-primary" />
                                                <span className="text-sm">Handle missing values (Mean Imputation)</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded border-2 border-primary bg-primary" />
                                                <span className="text-sm">Standardize Currency (to INR)</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-4 h-4 rounded border-2 border-primary bg-primary" />
                                                <span className="text-sm">Filter Outliers (3x Z-Score)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === "analyze" && (
                            <div className="space-y-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <BrainCircuit className="h-6 w-6 text-primary" />
                                    <div>
                                        <h3 className="text-xl font-bold">Model Configuration</h3>
                                        <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Select the engine for your analysis</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        { title: "Growth Forecast", model: "Prophet AI", desc: "Best for revenue prediction with seasonality.", icon: LineChart },
                                        { title: "Retention Analysis", model: "K-Means", desc: "Segment customers based on churn Risk.", icon: PieChart },
                                        { title: "Anomaly Detection", model: "Isolation Forest", desc: "Identify fraudulent or unusual expenses.", icon: Zap }
                                    ].map(card => (
                                        <div key={card.title} className="p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
                                            <card.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary mb-4 transition-colors" />
                                            <h4 className="font-bold text-lg mb-1">{card.title}</h4>
                                            <p className="text-xs font-mono text-primary uppercase mb-3">{card.model}</p>
                                            <p className="text-sm text-muted-foreground">{card.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentStep === "results" && (
                            <div className="space-y-8 h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <BarChart3 className="h-6 w-6 text-profit" />
                                        <div>
                                            <h3 className="text-xl font-bold">Analysis Results</h3>
                                            <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Report generated on {new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="font-mono text-xs uppercase tracking-widest gap-2">
                                        <Download className="h-4 w-4" />
                                        Export PDF
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="h-[300px] w-full bg-secondary/20 rounded-2xl flex items-center justify-center border border-dashed border-border">
                                            <LineChart className="h-12 w-12 text-muted-foreground/20" />
                                            <span className="ml-4 text-muted-foreground font-mono uppercase text-xs">Prophet Projection Graph</span>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-profit/5 border border-profit/20">
                                            <h4 className="font-bold mb-2 flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-profit" />
                                                AI Insight
                                            </h4>
                                            <p className="text-sm text-muted-foreground italic">
                                                "Based on the last 12 months, your revenue is projected to grow by 14.5% in Q3. Recommendation: Increase inventory for high-velocity items."
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-background border border-border/50">
                                            <h4 className="font-mono text-[10px] font-bold uppercase mb-4 text-muted-foreground">Key Metrics</h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-end border-b pb-2">
                                                    <span className="text-sm text-muted-foreground">Confidence Score</span>
                                                    <span className="text-xl font-bold font-mono text-profit">92%</span>
                                                </div>
                                                <div className="flex justify-between items-end border-b pb-2">
                                                    <span className="text-sm text-muted-foreground">MAPE (Error)</span>
                                                    <span className="text-xl font-bold font-mono text-warning">4.2%</span>
                                                </div>
                                                <div className="flex justify-between items-end border-b pb-2">
                                                    <span className="text-sm text-muted-foreground">Model Drift</span>
                                                    <span className="text-xl font-bold font-mono text-loss">Negligible</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === "upload"}
                            className="font-display font-bold uppercase tracking-widest"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={currentStep === "results"}
                            className="bg-primary hover:bg-primary/90 font-display font-bold uppercase tracking-widest px-8"
                        >
                            {currentStep === "analyze" ? "Run Analysis" : "Continue"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
