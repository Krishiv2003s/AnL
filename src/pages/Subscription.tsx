import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Shield, Zap, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AdBannerPlaceholder } from "@/components/AdBanner";

export default function Subscription() {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { user, profile, refetchProfile } = useAuth();

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
                key: import.meta.env.RAZORPAY_KEY_ID || "rzp_test_RvpJeh5t69CWJZ",
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

    const isPro = profile?.subscription_status === 'active';

    return (
        <div className="min-h-screen bg-background grid-bg">
            <Header />
            <main className="container pt-24 pb-12">
                <AdBannerPlaceholder className="h-20 mb-8" />

                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="font-display text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                            {isPro ? "Your Subscription" : "Upgrade to Pro"}
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {isPro
                                ? "You currently have unlimited access to all features."
                                : "Choose the plan that's right for your financial analysis."}
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:max-w-2xl lg:mx-auto">
                        {/* Free Plan (Always visible or contextual) */}
                        <Card className="flex flex-col border-border/50 bg-background/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Free</CardTitle>
                                <CardDescription>Get started with analysis</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">₹0</span>
                                    <span className="text-muted-foreground ml-1">/ month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">1 Document Analysis</span>
                                    </li>
                                    <li className="flex items-center gap-2 text-muted-foreground">
                                        <Check className="h-4 w-4" />
                                        <span className="text-sm">Standard Support</span>
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" disabled={!isPro}>
                                    {isPro ? "Current Plan" : "Already Used"}
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Pro Plan */}
                        <Card className={`flex flex-col relative overflow-hidden ${isPro ? 'border-primary shadow-lg shadow-primary/10' : 'border-border/50 bg-background/50 backdrop-blur-sm'}`}>
                            {!isPro && (
                                <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-bl-lg">
                                    POPULAR
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    Pro
                                    {isPro && <BadgeCheck className="h-5 w-5 text-primary" />}
                                </CardTitle>
                                <CardDescription>Unlimited financial insights</CardDescription>
                                <div className="mt-4">
                                    <span className="text-3xl font-bold">₹200</span>
                                    <span className="text-muted-foreground ml-1">/ month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-sky-400 fill-sky-400/20" />
                                        <span className="text-sm font-semibold">Unlimited Document Analysis</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">Simplifed Balance Sheet Generation</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-primary" />
                                        <span className="text-sm">Detailed Ai-powered ITR insights & Support</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-primary" />
                                        <span className="text-sm">Priority Support</span>
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={handleSubscribe}
                                    disabled={loading || isPro}
                                >
                                    {isPro ? "Active Subscription" : loading ? "Processing..." : "Upgrade Now"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {isPro && profile?.subscription_end_date && (
                        <div className="mt-8 p-4 bg-muted/30 rounded-lg border text-center font-mono text-sm text-muted-foreground">
                            Your subscription is active until: {new Date(profile.subscription_end_date).toLocaleDateString()}
                        </div>
                    )}
                </div>

                <AdBannerPlaceholder className="h-20 mt-12" />
            </main>
        </div>
    );
}
