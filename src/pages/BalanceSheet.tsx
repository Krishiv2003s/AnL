import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Archive, AlertTriangle, X, RotateCcw, Merge } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Header } from "@/components/Header";
import { SidebarAd } from "@/components/AdBanner";
import { MultiSelect } from "@/components/MultiSelect";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableAccountItem } from "@/components/SortableAccountItem";

interface Account {
    id: string; // or pseudo-id for new rows
    name: string;
    amount: number;
    type: "income" | "expenditure" | "asset" | "liability" | "cash_dr" | "cash_cr";
    is_editable: boolean;
}

interface BalanceSheetDetails {
    fy: string;
    contact: string;
    pan: string;
    capital_name: string;
    capital_amount: number;
    client_name: string;
    as_on_date: Date | undefined;
}

export default function BalanceSheet() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const componentRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<BalanceSheetDetails>({
        fy: "FY 24/25",
        contact: "",
        pan: "",
        capital_name: "Capital Account",
        capital_amount: 0,
        client_name: "",
        as_on_date: new Date("2025-03-31"),
    });

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);

    // Document Selection State
    const [availableDocs, setAvailableDocs] = useState<{ label: string; value: string }[]>([]);
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [isDocsLoaded, setIsDocsLoaded] = useState(false);

    // Selection / Merge State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

    // DnD State
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Calculations
    const [totals, setTotals] = useState({
        income: 0,
        expenditure: 0,
        netIncome: 0,
        assets: 0,
        liabilities: 0,
        cashCr: 0,
        cashDr: 0,
        closingCash: 0,
    });

    useEffect(() => {
        if (!authLoading && !user) navigate("/auth");
        if (user) {
            fetchDocuments();
            setDetails(prev => ({ ...prev, client_name: user.user_metadata?.username || "Client Name" }));
        }
    }, [user, authLoading]);

    // Fetch accounts whenever selected documents change, but only after initial doc load
    useEffect(() => {
        if (user && isDocsLoaded) {
            fetchAccounts();
        }
    }, [selectedDocs, isDocsLoaded]);

    useEffect(() => {
        calculateTotals();
    }, [accounts, details.capital_amount]);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from("documents")
                .select("id, file_name")
                .eq("user_id", user?.id)
                .eq("status", "analyzed") // Only show analyzed documents
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (data) {
                const options = data.map(d => ({ label: d.file_name, value: d.id }));
                setAvailableDocs(options);
                // Default: Select ALL documents
                setSelectedDocs(options.map(o => o.value));
            }
        } catch (error) {
            console.error("Error fetching documents:", error);
            toast({ title: "Error", description: "Failed to load documents", variant: "destructive" });
        } finally {
            setIsDocsLoaded(true);
        }
    };

    const fetchAccounts = async () => {
        if (selectedDocs.length === 0) {
            setAccounts([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from("categorized_accounts")
                .select("*")
                .eq("user_id", user?.id)
                .in("document_id", selectedDocs);

            if (error) throw error;

            const mappedAccounts: Account[] = [];

            // Map fetched accounts to buckets
            data?.forEach((acc: any) => {
                let type: Account["type"] = "asset"; // default
                const name = acc.account_name;
                const balance = Number(acc.net_balance);
                const classification = acc.classification?.toLowerCase();

                // Categorization Logic
                if (classification === "income" || acc.category === "income") {
                    type = "income";
                } else if (classification === "liability" || name.toLowerCase().includes("loan")) {
                    type = "liability";
                } else if (classification === "asset" || name.toLowerCase().includes("share")) {
                    type = "asset";
                } else {
                    // Default to expenditure if negative income? No, usually balance is abs.
                    // Assuming classification 'expense' or 'neutral' maps to Expenditure?
                    // The dashboard logic had classification "neutral".
                    // Let's use simple heuristics based on prompt
                    if (name.toLowerCase().includes("tds")) type = "expenditure";
                    else if (name.toLowerCase().includes("extra income")) type = "income";
                    else if (classification === 'expense' || balance < 0) type = "expenditure"; // heuristic
                    else type = "asset"; // Fallback
                }

                // Cash check - The user wants cash separated?
                // Actually the prompt says "fetch the various accounts and segment them... mandatory include the Cash account in assets"
                // And "calculate the Cash accounts closing balance by subtracting the Cash debited dr. from Cash Credited cr."
                // This implies we need to find "Cash" entries specifically.
                // If "categorized_accounts" already has a "Cash" account with a net balance, we might need to break it down?
                // Or does the user mean fetch Transactions? The DB table is "categorized_accounts", which are aggregated.
                // If we only have aggregated "Cash" account, we can't do Dr/Cr split unless we have transaction level data.
                // However, the dashboard logic shows `total_credit` and `total_debit` fields exist!
                if (name.toLowerCase().includes("cash")) {
                    if (acc.total_credit > 0) {
                        mappedAccounts.push({
                            id: `cash-cr-${acc.id}`,
                            name: `${name} (Inflow)`,
                            amount: Number(acc.total_credit),
                            type: "cash_cr",
                            is_editable: true
                        });
                    }
                    if (acc.total_debit > 0) {
                        mappedAccounts.push({
                            id: `cash-dr-${acc.id}`,
                            name: `${name} (Outflow)`,
                            amount: Number(acc.total_debit),
                            type: "cash_dr",
                            is_editable: true
                        });
                    }
                    // The "Closing Balance" will be calculated and added to Assets dynamically, not pushed as an editable row here.
                    return;
                }

                mappedAccounts.push({
                    id: acc.id,
                    name: name,
                    amount: Math.abs(balance), // Balance sheet usually shows absolute amounts
                    type: type,
                    is_editable: true,
                });
            });

            setAccounts(mappedAccounts);
        } catch (error) {
            console.error("Error fetching accounts:", error);
            toast({ title: "Error", description: "Failed to load accounts", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        let income = 0, expenditure = 0, assets = 0, liabilities = 0, cashCr = 0, cashDr = 0;

        accounts.forEach(acc => {
            if (acc.type === "income") income += acc.amount;
            if (acc.type === "expenditure") expenditure += acc.amount;
            if (acc.type === "asset") assets += acc.amount;
            if (acc.type === "liability") liabilities += acc.amount;
            if (acc.type === "cash_cr") cashCr += acc.amount;
            if (acc.type === "cash_dr") cashDr += acc.amount;
        });

        const netIncome = income - expenditure;
        // User requested closing cash = Cr - Dr (Inflow - Outflow)
        // Wait, prompt said: "subtracting the Cash debited dr. from Cash Credited cr."
        // In my types: cash_cr is Inflow (based on image left side/Cr label?? No, usually Cr is Right/Payment. But Image "Cr" side has "Opening Balance". So Left=Cr in User's generic ledger?? This is confusing. 
        // Let's stick to the Prompt Text: "Cash Credited cr." - "Cash debited dr.".
        // And standard: `total_credit` usually means Credit column. `total_debit` Debit column.
        // If standard accounting: Asset Dr = Increase, Cr = Decrease.
        // So Closing = Dr - Cr.
        // But User said: "subtract Dr from Cr".
        // I will follow "Cr - Dr" as strictly requested, assuming user's data mapping implies Cr is the positive inflow.
        // Or I'll just use `Math.abs(acc.net_balance)` if available? No, must separate.
        const closingCash = cashCr - cashDr;

        // Add Special Items to totals
        // 1. Net Income goes to Liabilities (Capital)
        const capitalTotal = details.capital_amount + netIncome;
        const finalLiabilities = liabilities + capitalTotal;

        // 2. Closing Cash goes to Assets
        const finalAssets = assets + closingCash;

        setTotals({ income, expenditure, netIncome, assets: finalAssets, liabilities: finalLiabilities, cashCr, cashDr, closingCash });

        // Warnings
        const newWarnings = [];
        if (closingCash < 0) newWarnings.push("Warning: Closing Cash Balance is negative!");
        if (Math.abs(finalAssets - finalLiabilities) > 1) newWarnings.push("Warning: Balance Sheet is not tallied! Assets ≠ Liabilities");

        setWarnings(newWarnings);
    };

    const updateAccount = (id: string, field: "name" | "amount", value: any) => {
        setAccounts(prev => prev.map(acc =>
            acc.id === id ? { ...acc, [field]: field === "amount" ? Number(value) : value } : acc
        ));
    };

    const dismissWarning = (index: number) => {
        setWarnings(prev => prev.filter((_, i) => i !== index));
    };

    const addRow = (type: Account["type"]) => {
        const newAccount: Account = {
            id: `new-${Date.now()}`,
            name: "New Entry",
            amount: 0,
            type,
            is_editable: true,
        };
        setAccounts(prev => [...prev, newAccount]);
    };

    const removeRow = (id: string) => {
        setAccounts(prev => prev.filter(acc => acc.id !== id));
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Balance_Sheet_${details.fy.replace("/", "-")}`,
    });

    const handleReset = () => {
        // 1. Reset selection (which triggers fetchAccounts to clear or default if logic changed)
        // If we set selectedDocs to [], fetchAccounts sets accounts to [].
        setSelectedDocs([]);

        // 2. Clear Accounts directly (redundant but safe)
        setAccounts([]);

        // 3. Reset Details
        setDetails({
            fy: "FY 24/25",
            contact: "",
            pan: "",
            capital_name: "Capital Account",
            capital_amount: 0,
            client_name: "",
            as_on_date: new Date("2025-03-31"),
        });

        // 4. Clear Warnings
        setWarnings([]);

        toast({ title: "Reset", description: "Balance sheet cleared.", });
    };

    const toggleSelection = (id: string) => {
        setSelectedAccountIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleMerge = () => {
        if (selectedAccountIds.length < 2) return;

        const selectedAccounts = accounts.filter(acc => selectedAccountIds.includes(acc.id));
        if (selectedAccounts.length === 0) return;

        // Use properties of the first selected item as base (e.g. type)
        const base = selectedAccounts[0];
        const totalAmount = selectedAccounts.reduce((sum, acc) => sum + acc.amount, 0);
        const combinedName = selectedAccounts.map(acc => acc.name).join(" & ");

        const newAccount: Account = {
            id: `merged-${Date.now()}`,
            name: combinedName,
            amount: totalAmount,
            type: base.type,
            is_editable: true,
        };

        // Remove selected items and add new merged item
        setAccounts(prev => [
            ...prev.filter(acc => !selectedAccountIds.includes(acc.id)),
            newAccount
        ]);

        // Reset Selection
        setSelectedAccountIds([]);
        setIsSelectionMode(false);
        toast({ title: "Merged", description: `Merged ${selectedAccounts.length} items.` });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeAccount = accounts.find(acc => acc.id === active.id);
        if (!activeAccount) {
            setActiveId(null);
            return;
        }

        // 1. Dropped on a Section Container
        const overId = over.id as string;
        const validTypes: Account["type"][] = ["income", "expenditure", "asset", "liability"];
        if (validTypes.includes(overId as any)) {
            // Move to section
            if (activeAccount.type !== overId) {
                setAccounts(prev => prev.map(acc =>
                    acc.id === active.id ? { ...acc, type: overId as Account["type"] } : acc
                ));
            }
            setActiveId(null);
            return;
        }

        // 2. Dropped on another Account Item
        const overAccount = accounts.find(acc => acc.id === over.id);
        if (overAccount) {
            // A. Move to different section (if types differ)
            if (activeAccount.type !== overAccount.type) {
                setAccounts(prev => {
                    // Change type
                    const updated = prev.map(acc =>
                        acc.id === active.id ? { ...acc, type: overAccount.type } : acc
                    );
                    // Reorder to position of overAccount
                    const oldIndex = updated.findIndex(acc => acc.id === active.id);
                    const newIndex = updated.findIndex(acc => acc.id === over.id);
                    return arrayMove(updated, oldIndex, newIndex);
                });
            } else {
                // B. Reorder within same section (OR Merge?)
                // If we want to implement Merge: we can check if they are "mergable".
                // BUT standard Sortable behavior is reorder.
                // Let's implement Reorder for now.
                if (active.id !== over.id) {
                    setAccounts(prev => {
                        const oldIndex = prev.findIndex(acc => acc.id === active.id);
                        const newIndex = prev.findIndex(acc => acc.id === over.id);
                        return arrayMove(prev, oldIndex, newIndex);
                    });
                }
            }
        }

        setActiveId(null);
    };

    // Helper to get items for sections
    const getSectionItems = (type: Account["type"]) => accounts.filter(a => a.type === type);

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-background grid-bg relative">
            <Header />
            <SidebarAd side="left" />
            <SidebarAd side="right" />
            <main className="container pt-24 pb-12 relative z-0">
                {/* Disclaimer / Warning Header */}
                {warnings.length > 0 && (
                    <div className="mb-4 p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
                        {warnings.map((w, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 text-yellow-500 mb-1 last:mb-0">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> {w}
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-yellow-500/20" onClick={() => dismissWarning(i)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Inputs Header */}
                <div className="flex justify-between items-start mb-8 gap-4 no-print">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
                        <div>
                            <Label>Client Name</Label>
                            <Input value={details.client_name} onChange={e => setDetails({ ...details, client_name: e.target.value })} />
                        </div>
                        <div>
                            <Label>Documents Source</Label>
                            <MultiSelect
                                options={availableDocs}
                                selected={selectedDocs}
                                onChange={setSelectedDocs}
                                placeholder="Select documents"
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label>Financial Year</Label>
                            <Input value={details.fy} onChange={e => setDetails({ ...details, fy: e.target.value })} />
                        </div>
                        <div>
                            <Label>As on Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !details.as_on_date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {details.as_on_date ? format(details.as_on_date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={details.as_on_date}
                                        onSelect={(date) => setDetails({ ...details, as_on_date: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label>Contact Details</Label>
                            <Input value={details.contact} onChange={e => setDetails({ ...details, contact: e.target.value })} placeholder="+91..." />
                        </div>
                        <div>
                            <Label>PAN (Optional)</Label>
                            <Input value={details.pan} onChange={e => setDetails({ ...details, pan: e.target.value })} />
                        </div>
                        <div>
                            <Label>Capital Amount</Label>
                            <Input type="number" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" value={details.capital_amount} onChange={e => setDetails({ ...details, capital_amount: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <Button onClick={handleReset} variant="outline" className="text-destructive hover:text-destructive">
                            <RotateCcw className="mr-2 h-4 w-4" /> Reset
                        </Button>
                        <Button onClick={() => handlePrint()} variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                        <Button
                            variant={isSelectionMode ? "secondary" : "outline"}
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedAccountIds([]);
                            }}
                        >
                            {isSelectionMode ? "Cancel Select" : "Select & Merge"}
                        </Button>
                        {isSelectionMode && selectedAccountIds.length > 1 && (
                            <Button onClick={handleMerge} variant="default">
                                <Merge className="mr-2 h-4 w-4" /> Merge ({selectedAccountIds.length})
                            </Button>
                        )}
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {/* PRINTABLE AREA */}
                    <div ref={componentRef} className="bg-white text-black p-8 max-w-5xl mx-auto shadow-xl print:shadow-none print:w-full">
                        {/* Header */}
                        <div className="text-center mb-6 border-b-2 border-black pb-4">
                            <h1 className="text-2xl font-bold uppercase">{details.client_name}</h1>
                            <div className="flex justify-between font-bold mt-2">
                                <span>INCOME AND EXPENDITURE ACCOUNT AS ON {details.as_on_date ? format(details.as_on_date, "do MMMM, yyyy").toUpperCase() : "..."}</span>
                                <span>FY {details.fy}</span>
                            </div>
                        </div>

                        {/* INCOME AND EXPENDITURE TABLE */}
                        <div className="grid grid-cols-2 border-2 border-black mb-8">
                            {/* Expenditure Side */}
                            <div className="border-r-2 border-black flex flex-col">
                                <div className="flex justify-between font-bold border-b border-black p-1 bg-gray-100">
                                    <span>EXPENDITURE</span><span>AMT</span>
                                </div>
                                <SortableContext
                                    id="expenditure"
                                    items={getSectionItems("expenditure").map(a => a.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="p-1 min-h-[200px] flex-1">
                                        {getSectionItems("expenditure").map(acc => (
                                            <SortableAccountItem key={acc.id} id={acc.id}>
                                                <div className="flex justify-between items-center group text-sm mb-1 hover:bg-gray-50 gap-2">
                                                    {isSelectionMode && (
                                                        <Checkbox
                                                            checked={selectedAccountIds.includes(acc.id)}
                                                            onCheckedChange={() => toggleSelection(acc.id)}
                                                            className="h-4 w-4 no-print"
                                                        />
                                                    )}
                                                    <input className="w-full bg-transparent border-none focus:outline-none" value={acc.name} onChange={e => updateAccount(acc.id, "name", e.target.value)} />
                                                    <div className="flex items-center">
                                                        <input className="w-24 text-right bg-transparent border-none focus:outline-none" type="number" value={acc.amount} onChange={e => updateAccount(acc.id, "amount", e.target.value)} />
                                                        <button onClick={() => removeRow(acc.id)} className="opacity-0 group-hover:opacity-100 text-red-500 ml-2 no-print">x</button>
                                                    </div>
                                                </div>
                                            </SortableAccountItem>
                                        ))}
                                        <Button variant="ghost" size="sm" onClick={() => addRow("expenditure")} className="w-full text-xs text-muted-foreground no-print">+ Add</Button>
                                        {/* Drop Zone Placeholder for empty list? The min-h-[200px] handles it */}
                                    </div>
                                </SortableContext>
                                {/* Total */}
                                {/* Total */}
                                <div className="flex justify-between font-bold border-t border-black p-1 mt-auto">
                                    <span>Total</span><span>{totals.expenditure.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Income Side */}
                            <div className="flex flex-col">
                                <div className="flex justify-between font-bold border-b border-black p-1 bg-gray-100">
                                    <span>INCOME</span><span>AMT</span>
                                </div>
                                <SortableContext
                                    id="income"
                                    items={getSectionItems("income").map(a => a.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="p-1 min-h-[200px] flex-1">
                                        {getSectionItems("income").map(acc => (
                                            <SortableAccountItem key={acc.id} id={acc.id}>
                                                <div className="flex justify-between items-center group text-sm mb-1 hover:bg-gray-50 gap-2">
                                                    {isSelectionMode && (
                                                        <Checkbox
                                                            checked={selectedAccountIds.includes(acc.id)}
                                                            onCheckedChange={() => toggleSelection(acc.id)}
                                                            className="h-4 w-4 no-print"
                                                        />
                                                    )}
                                                    <input className="w-full bg-transparent border-none focus:outline-none" value={acc.name} onChange={e => updateAccount(acc.id, "name", e.target.value)} />
                                                    <div className="flex items-center">
                                                        <input className="w-24 text-right bg-transparent border-none focus:outline-none" type="number" value={acc.amount} onChange={e => updateAccount(acc.id, "amount", e.target.value)} />
                                                        <button onClick={() => removeRow(acc.id)} className="opacity-0 group-hover:opacity-100 text-red-500 ml-2 no-print">x</button>
                                                    </div>
                                                </div>
                                            </SortableAccountItem>
                                        ))}
                                        <Button variant="ghost" size="sm" onClick={() => addRow("income")} className="w-full text-xs text-muted-foreground no-print">+ Add</Button>
                                    </div>
                                </SortableContext>
                                {/* Total */}
                                {/* Total */}
                                <div className="flex justify-between font-bold border-t border-black p-1 mt-auto">
                                    <span>Total</span><span>{totals.income.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* NET INCOME ROW (Spans both cols or just calculated at bottom) */}
                            {/* User image shows Net Income on Left (Expenditure) side to balance, or just below total. */}
                            {/* Standard: If Income > Exp, 'Surplus/Net Income' is on Expenditure side to tally. */}
                            <div className="col-span-2 border-t border-black p-1 font-bold flex justify-between bg-green-50">
                                <span>Net Income</span>
                                <span>{totals.netIncome.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* BALANCE SHEET HEADER */}
                        <div className="text-center mb-0 border-b-2 border-black pb-1 bg-gray-100 border-2 border-b-0">
                            <h2 className="font-bold">BALANCE SHEET AS ON {details.as_on_date ? format(details.as_on_date, "do MMMM, yyyy").toUpperCase() : "..."}</h2>
                        </div>

                        {/* BALANCE SHEET TABLE */}
                        <div className="grid grid-cols-2 border-2 border-black mb-8">
                            {/* Liabilities Side */}
                            <div className="border-r-2 border-black flex flex-col">
                                <div className="flex justify-between font-bold border-b border-black p-1 bg-gray-100">
                                    <span>LIABILITIES</span><span>AMT Rs</span>
                                </div>
                                <div className="p-1 min-h-[200px] flex-1">
                                    {/* Capital Account Block */}
                                    <div className="mb-4 border-b border-dashed border-gray-400 pb-2">
                                        <div className="font-bold underline mb-1">CAPITAL ACCOUNT</div>
                                        <div className="flex justify-between text-sm">
                                            <span>{user?.user_metadata?.username} (Capital)</span>
                                            <span>{details.capital_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-green-700">
                                            <span>ADD: Net Income</span>
                                            <span>{totals.netIncome.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-bold border-t border-gray-300 mt-1 pt-1">
                                            <span>Subtotal</span>
                                            <span>{(details.capital_amount + totals.netIncome).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <SortableContext
                                        id="liability"
                                        items={getSectionItems("liability").map(a => a.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {getSectionItems("liability").map(acc => (
                                            <SortableAccountItem key={acc.id} id={acc.id}>
                                                <div className="flex justify-between items-center group text-sm mb-1 hover:bg-gray-50 gap-2">
                                                    {isSelectionMode && (
                                                        <Checkbox
                                                            checked={selectedAccountIds.includes(acc.id)}
                                                            onCheckedChange={() => toggleSelection(acc.id)}
                                                            className="h-4 w-4 no-print"
                                                        />
                                                    )}
                                                    <input className="w-full bg-transparent border-none focus:outline-none" value={acc.name} onChange={e => updateAccount(acc.id, "name", e.target.value)} />
                                                    <div className="flex items-center">
                                                        <input className="w-24 text-right bg-transparent border-none focus:outline-none" type="number" value={acc.amount} onChange={e => updateAccount(acc.id, "amount", e.target.value)} />
                                                        <button onClick={() => removeRow(acc.id)} className="opacity-0 group-hover:opacity-100 text-red-500 ml-2 no-print">x</button>
                                                    </div>
                                                </div>
                                            </SortableAccountItem>
                                        ))}
                                        <Button variant="ghost" size="sm" onClick={() => addRow("liability")} className="w-full text-xs text-muted-foreground no-print">+ Add</Button>
                                    </SortableContext>
                                </div>
                                {/* Total */}
                                <div className="flex justify-between font-bold border-t border-black p-1 mt-auto">
                                    <span>Total</span><span>{totals.liabilities.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Assets Side */}
                            <div className="flex flex-col">
                                <div className="flex justify-between font-bold border-b border-black p-1 bg-gray-100">
                                    <span>ASSETS</span><span>AMT Rs</span>
                                </div>
                                <SortableContext
                                    id="asset"
                                    items={getSectionItems("asset").map(a => a.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="p-1 min-h-[200px] flex-1">
                                        {getSectionItems("asset").map(acc => (
                                            <SortableAccountItem key={acc.id} id={acc.id}>
                                                <div className="flex justify-between items-center group text-sm mb-1 hover:bg-gray-50 gap-2">
                                                    {isSelectionMode && (
                                                        <Checkbox
                                                            checked={selectedAccountIds.includes(acc.id)}
                                                            onCheckedChange={() => toggleSelection(acc.id)}
                                                            className="h-4 w-4 no-print"
                                                        />
                                                    )}
                                                    <input className="w-full bg-transparent border-none focus:outline-none" value={acc.name} onChange={e => updateAccount(acc.id, "name", e.target.value)} />
                                                    <div className="flex items-center">
                                                        <input className="w-24 text-right bg-transparent border-none focus:outline-none" type="number" value={acc.amount} onChange={e => updateAccount(acc.id, "amount", e.target.value)} />
                                                        <button onClick={() => removeRow(acc.id)} className="opacity-0 group-hover:opacity-100 text-red-500 ml-2 no-print">x</button>
                                                    </div>
                                                </div>
                                            </SortableAccountItem>
                                        ))}
                                        <Button variant="ghost" size="sm" onClick={() => addRow("asset")} className="w-full text-xs text-muted-foreground no-print">+ Add</Button>

                                        {/* Closing Cash */}
                                        <div className="flex justify-between items-center text-sm font-bold border-t border-dashed border-gray-400 pt-2 mt-2">
                                            <span>Cash (Closing Balance)</span>
                                            <span className={totals.closingCash < 0 ? "text-red-500" : ""}>{totals.closingCash.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </SortableContext>
                                {/* Total */}
                                <div className="flex justify-between font-bold border-t border-black p-1 mt-auto">
                                    <span>Total</span><span>{totals.assets.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex justify-between text-sm font-mono border-t border-black pt-2">
                            <span>Contact: {details.contact}</span>
                            <span>PAN: {details.pan}</span>
                        </div>

                        <div className="my-8"></div>

                        {/* CASH ACCOUNT TABLE */}
                        <div className="text-center mb-0 border-b-2 border-black pb-1 bg-gray-100 border-2 border-b-0">
                            <h2 className="font-bold">CASH ACCOUNT</h2>
                        </div>
                        <div className="grid grid-cols-2 border-2 border-black">
                            {/* Cr Side (User Label: Cr, Logic: Inflow based on prompt requiring subtraction from this) */}
                            <div className="border-r-2 border-black">
                                <div className="flex justify-between font-bold border-b border-black p-1 bg-gray-100">
                                    <span>Cr. (Inflow)</span><span>AMT</span>
                                </div>
                                <div className="p-1 min-h-[150px]">
                                    {accounts.filter(a => a.type === "cash_cr").map(acc => (
                                        <div key={acc.id} className="flex justify-between items-center group text-sm mb-1 hover:bg-gray-50">
                                            <input className="w-full bg-transparent border-none focus:outline-none" value={acc.name} onChange={e => updateAccount(acc.id, "name", e.target.value)} />
                                            <input className="w-24 text-right bg-transparent border-none focus:outline-none" type="number" value={acc.amount} onChange={e => updateAccount(acc.id, "amount", e.target.value)} />
                                        </div>
                                    ))}
                                    <Button variant="ghost" size="sm" onClick={() => addRow("cash_cr")} className="w-full text-xs text-muted-foreground no-print">+ Add</Button>
                                </div>
                                <div className="flex justify-between font-bold border-t border-black p-1">
                                    <span>Total Cr.</span><span>{totals.cashCr.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Dr Side */}
                            <div>
                                <div className="flex justify-between font-bold border-b border-black p-1 bg-gray-100">
                                    <span>Dr. (Outflow)</span><span>AMT</span>
                                </div>
                                <div className="p-1 min-h-[150px]">
                                    {accounts.filter(a => a.type === "cash_dr").map(acc => (
                                        <div key={acc.id} className="flex justify-between items-center group text-sm mb-1 hover:bg-gray-50">
                                            <input className="w-full bg-transparent border-none focus:outline-none" value={acc.name} onChange={e => updateAccount(acc.id, "name", e.target.value)} />
                                            <div className="flex items-center">
                                                <input className="w-24 text-right bg-transparent border-none focus:outline-none" type="number" value={acc.amount} onChange={e => updateAccount(acc.id, "amount", e.target.value)} />
                                                <button onClick={() => removeRow(acc.id)} className="opacity-0 group-hover:opacity-100 text-red-500 ml-2 no-print">x</button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="ghost" size="sm" onClick={() => addRow("cash_dr")} className="w-full text-xs text-muted-foreground no-print">+ Add</Button>
                                </div>
                                <div className="flex justify-between font-bold border-t border-black p-1">
                                    <span>Total Dr.</span><span>{totals.cashDr.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="border-2 border-t-0 border-black p-2 font-bold flex justify-between bg-gray-50">
                            <span>Closing Balance (Cr - Dr)</span>
                            <span>{totals.closingCash.toFixed(2)}</span>
                        </div>

                    </div>


                    <DragOverlay>
                        {activeId ? (
                            <div className="bg-white p-2 border border-black shadow-lg rounded opacity-80 w-[300px]">
                                {(() => {
                                    const acc = accounts.find(a => a.id === activeId);
                                    return acc ? (
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span>{acc.name}</span>
                                            <span>{acc.amount}</span>
                                        </div>
                                    ) : null;
                                })()}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </main>
        </div>
    );
}
