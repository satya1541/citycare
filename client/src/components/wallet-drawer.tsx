import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, ArrowLeft, ArrowUpRight, ArrowDownLeft, Plus, Loader2, IndianRupee, History as HistoryIcon, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
    getWalletBalance,
    getWalletTransactions,
    createWalletTopup,
    verifyWalletTopup,
    loadRazorpay
} from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function WalletDrawer() {
    const { user, showWalletDrawer, setShowWalletDrawer } = useAuth();
    const { toast } = useToast();

    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isToppingUp, setIsToppingUp] = useState(false);
    const [topupAmount, setTopupAmount] = useState<string>("");
    const [recentSuccess, setRecentSuccess] = useState<{ amount: number; newBalance: number } | null>(null);

    useEffect(() => {
        if (user && showWalletDrawer) {
            fetchWalletData();
        }
    }, [user, showWalletDrawer]);

    const fetchWalletData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [balanceRes, txRes] = await Promise.all([
                getWalletBalance(user.id),
                getWalletTransactions(user.id)
            ]);

            if (balanceRes.success) {
                setBalance(balanceRes.data.balanceInPaisa / 100);
            }
            if (txRes.success) {
                setTransactions(txRes.data);
            }
        } catch (error) {
            console.error("Failed to fetch wallet data", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTopup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !topupAmount || isNaN(Number(topupAmount)) || Number(topupAmount) <= 0) {
            toast({ title: "Invalid amount", description: "Please enter a valid a amount greater than 0", variant: "destructive" });
            return;
        }

        setIsToppingUp(true);
        try {
            // 1. Create order
            const amountInPaisa = Math.round(Number(topupAmount) * 100);
            const orderRes = await createWalletTopup(user.id, amountInPaisa);

            if (!orderRes.success) {
                throw new Error(orderRes.message || "Failed to create order");
            }

            // 2. Load Razorpay script
            const res = await loadRazorpay();
            if (!res) {
                throw new Error("Razorpay SDK failed to load. Are you online?");
            }

            // 3. Setup Razorpay options
            const options = {
                key: orderRes.data.razorpayKey || "rzp_test_Rd82dGLg9aCywP",
                amount: orderRes.data.amountInPaisa || orderRes.data.amount,
                currency: orderRes.data.currency || "INR",
                name: "City Cares Wallet",
                description: "Wallet Topup",
                order_id: orderRes.data.razorpayOrderId || orderRes.data.id,
                prefill: {
                    name: user.fullName || "",
                    email: user.email || "",
                    contact: user.phoneNo || ""
                },
                theme: {
                    color: "#004e92"
                },
                handler: async function (response: any) {
                    try {
                        const verifyRes = await verifyWalletTopup(user.id, {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            amountInPaisa: amountInPaisa
                        });

                        if (verifyRes.success) {
                            const addedAmount = amountInPaisa / 100;
                            // Fetch fresh balance immediately for the success message
                            const freshBalanceRes = await getWalletBalance(user.id);
                            const newBalance = freshBalanceRes.success ? freshBalanceRes.data.balanceInPaisa / 100 : 0;

                            setRecentSuccess({ amount: addedAmount, newBalance });
                            toast({ title: "Topup Successful!", description: `Added ₹${addedAmount} to your wallet.` });
                            setTopupAmount("");
                            fetchWalletData(); // Refresh UI

                            // Auto-hide after 10 seconds
                            setTimeout(() => setRecentSuccess(null), 10000);
                        } else {
                            toast({ title: "Verification Failed", description: verifyRes.message, variant: "destructive" });
                        }
                    } catch (err: any) {
                        toast({ title: "Error", description: "Payment verification failed.", variant: "destructive" });
                    }
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.on('payment.failed', function (response: any) {
                toast({ title: "Payment Failed", description: response.error.description, variant: "destructive" });
            });
            paymentObject.open();

        } catch (error: any) {
            console.error("Topup error:", error);
            toast({ title: "Failed to initiate topup", description: error.message, variant: "destructive" });
        } finally {
            setIsToppingUp(false);
        }
    };

    return (
        <Sheet open={showWalletDrawer} onOpenChange={setShowWalletDrawer}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-sm shadow-2xl">
                <SheetHeader className="px-4 py-4 border-b bg-background/50 backdrop-blur sticky top-0 z-10 text-left flex flex-row items-center gap-3 space-y-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden -ml-2 shrink-0" onClick={() => setShowWalletDrawer(false)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <SheetTitle className="text-xl flex items-center gap-2 m-0">
                        <Wallet className="h-5 w-5 text-primary hidden sm:block" />
                        My Wallet
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                        Manage your wallet balance and view transaction history.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6 py-6 overflow-y-auto">
                    <div className="space-y-8 pb-10">

                        {/* Balance Card */}
                        <div className="bg-gradient-to-br from-[#004e92] to-[#000428] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-lg" />

                            <div className="relative z-10">
                                <p className="text-blue-100/80 text-sm font-medium mb-1 tracking-wide">Available Balance</p>
                                <div className="flex items-baseline gap-1">
                                    <IndianRupee className="w-8 h-8" strokeWidth={2.5} />
                                    <h2 className="text-5xl font-bold tracking-tight">
                                        {isLoading ? "..." : balance.toFixed(2)}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        {/* Topup Form */}
                        <div className="bg-white rounded-xl shadow-sm border p-5">
                            <h3 className="font-semibold text-foreground mb-4">Add Money to Wallet</h3>
                            <form onSubmit={handleTopup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Amount (₹)</Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={topupAmount}
                                            onChange={(e) => setTopupAmount(e.target.value)}
                                            className="pl-9 h-12 text-lg font-medium"
                                            placeholder="Enter amount"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    {[500, 1000, 2000].map(amt => (
                                        <Button
                                            key={amt}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-dashed"
                                            onClick={() => setTopupAmount(amt.toString())}
                                        >
                                            +₹{amt}
                                        </Button>
                                    ))}
                                </div>

                                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isToppingUp || isLoading}>
                                    {isToppingUp ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                                    Proceed to Add Money
                                </Button>
                            </form>
                        </div>

                        {/* Transactions List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground">Recent Transactions</h3>
                            </div>

                            <div className="space-y-3">
                                {isLoading ? (
                                    <div className="py-8 text-center flex flex-col items-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                                        <p className="text-xs text-muted-foreground">Loading history...</p>
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="py-10 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                                        <HistoryIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-foreground">No transactions yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">Add money to see your history here.</p>
                                    </div>
                                ) : (
                                    transactions.map(tx => {
                                        const isCredit = tx.type === 'CREDIT' || tx.type === 'TOPUP' || tx.type === 'REFUND';
                                        return (
                                            <div key={tx.id} className="bg-white border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                        }`}>
                                                        {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm capitalize">{tx.description || tx.type.toLowerCase()}</p>
                                                        <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy • h:mm a")}</p>
                                                    </div>
                                                </div>
                                                <div className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isCredit ? '+' : '-'}₹{(tx.amountInPaisa / 100).toFixed(2)}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </ScrollArea>
            </SheetContent>

            {/* Success Modal */}
            <Dialog open={!!recentSuccess} onOpenChange={(open) => !open && setRecentSuccess(null)}>
                <DialogContent className="sm:max-w-md text-center flex flex-col items-center justify-center p-8 border-green-200" aria-describedby={undefined}>
                    <DialogHeader className="hidden">
                        <DialogTitle>Payment Successful</DialogTitle>
                    </DialogHeader>
                    <div className="bg-green-100 rounded-full p-4 mb-4">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h3>
                    {recentSuccess && (
                        <div className="space-y-2 text-muted-foreground w-full bg-green-50/50 p-4 rounded-xl border border-green-100 mt-2">
                            <p>
                                Successfully added <span className="font-bold text-black">₹{recentSuccess.amount.toFixed(2)}</span>
                            </p>
                            <div className="border-t border-green-200/50 pt-3 mt-3">
                                <p className="text-sm mb-1 uppercase tracking-wider font-semibold text-green-800">New Total Balance</p>
                                <span className="text-4xl font-black text-green-700">₹{recentSuccess.newBalance.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                    <Button className="w-full mt-6 h-12 text-lg bg-green-600 hover:bg-green-700 text-white font-bold" onClick={() => setRecentSuccess(null)}>
                        Done
                    </Button>
                </DialogContent>
            </Dialog>
        </Sheet>
    );
}
