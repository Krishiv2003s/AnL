import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Shield, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { user, refetchProfile } = useAuth();

    useEffect(() => {
        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const handleSubscribe = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Create Order
            const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-ops', {
                body: { action: 'create-order' }
            });

            if (orderError) throw new Error(orderError.message || 'Failed to create order');

            // 2. Open Razorpay Checkout
            const options = {
                key: import.meta.env.RAZORPAY_KEY_ID || "rzp_test_RvpJeh5t69CWJZ", // Fallback for dev if env missing
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Ledger Love Pro",
                description: "Monthly Subscription",
                order_id: orderData.id,
                handler: async function (response: any) {
                    try {
                        // 3. Verify Payment
                        const { error: verifyError } = await supabase.functions.invoke('razorpay-ops', {
                            body: {
                                action: 'verify-payment',
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }
                        });

                        if (verifyError) throw verifyError;

                        toast({
                            title: "Upgrade Successful!",
                            description: "Welcome to Pro. You now have unlimited access.",
                        });

                        await refetchProfile();
                        onClose();
                    } catch (error) {
                        console.error('Verification failed', error);
                        toast({
                            title: "Payment Verification Failed",
                            description: "Please contact support if money was deducted.",
                            variant: "destructive",
                        });
                    }
                },
                prefill: {
                    email: user.email,
                },
                theme: {
                    color: "#0F172A",
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast({
                    title: "Payment Failed",
                    description: response.error.description,
                    variant: "destructive",
                });
            });
            rzp.open();

        } catch (error: any) {
            console.error('Payment error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to initiate payment",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="h-6 w-6 text-sky-400 fill-sky-400/20" />
                        Upgrade to Pro
                    </DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        Unlock unlimited AI capabilities for your financial documents.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="p-4 bg-muted/50 rounded-lg border">
                        <div className="flex justify-between items-baseline mb-4">
                            <span className="text-3xl font-bold">₹200</span>
                            <span className="text-muted-foreground">/ month</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-sky-400 fill-sky-400/20" />
                                <span className="text-sm font-semibold">Unlimited Document Analysis</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Simplifed Balance Sheet Generation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Detailed Ai-powered ITR insights & Support</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span className="text-sm">Priority Support</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button
                        className="w-full text-lg py-6"
                        onClick={handleSubscribe}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Subscribe Now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
