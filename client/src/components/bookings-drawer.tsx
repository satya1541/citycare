import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Clock, Loader2, AlertCircle, User, Phone, ArrowLeft, Star, Calendar, Package, XCircle, CalendarClock } from "lucide-react";
import { getUserBookings, Booking, rateBooking, cancelBooking, rescheduleBooking, getAvailableSlots, TimeSlot } from "@/lib/bookings";
import { format, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BookingsDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BookingsDrawer({ open, onOpenChange }: BookingsDrawerProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [ratingBookingId, setRatingBookingId] = useState<number | null>(null);
    const [ratingData, setRatingData] = useState({ rating: 5, reviewText: "" });
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);

    // Cancel State
    const [cancelBookingId, setCancelBookingId] = useState<number | null>(null);
    const [cancelReason, setCancelReason] = useState("");
    const [isCanceling, setIsCanceling] = useState(false);

    // Reschedule State
    const [rescheduleBookingId, setRescheduleBookingId] = useState<number | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
    const [rescheduleSlot, setRescheduleSlot] = useState<string>("");
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [isFetchingSlots, setIsFetchingSlots] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);

    useEffect(() => {
        if (open && user?.id) {
            fetchBookings();
        }
    }, [open, user?.id]);

    const fetchBookings = async () => {
        if (!user) return;
        setIsLoading(true);
        setError("");
        try {
            const data = await getUserBookings(user.id);
            if (data.success && Array.isArray(data.data)) {
                setBookings(data.data);
            } else {
                setBookings([]);
            }
        } catch (err) {
            console.error("Failed to fetch bookings", err);
            setError("Failed to load bookings. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'confirmed': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
            case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
            default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
        }
    };

    const handleRateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !ratingBookingId) return;
        setIsSubmittingRating(true);
        try {
            await rateBooking(ratingBookingId, user.id, ratingData);
            setRatingBookingId(null);
            setRatingData({ rating: 5, reviewText: "" });
            toast({
                title: "Rating Submitted",
                description: "Thank you for your feedback!",
            });
            fetchBookings();
        } catch (error) {
            console.error("Failed to submit rating", error);
            toast({
                title: "Error",
                description: "Failed to submit rating. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmittingRating(false);
        }
    };

    const handleCancelSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !cancelBookingId || !cancelReason.trim()) return;
        setIsCanceling(true);
        try {
            const res = await cancelBooking(cancelBookingId, user.id, cancelReason);
            if (res.success) {
                toast({ title: "Booking Cancelled", description: "Your booking has been cancelled successfully." });
                setCancelBookingId(null);
                setCancelReason("");
                fetchBookings();
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast({ title: "Failed to cancel", description: error.message || "An error occurred", variant: "destructive" });
        } finally {
            setIsCanceling(false);
        }
    };

    const handleRescheduleSubmit = async () => {
        if (!user || !rescheduleBookingId || !rescheduleDate || !rescheduleSlot) return;
        setIsRescheduling(true);
        try {
            const dateStr = format(rescheduleDate, "yyyy-MM-dd");
            const res = await rescheduleBooking(rescheduleBookingId, user.id, dateStr, rescheduleSlot);
            if (res.success) {
                toast({ title: "Booking Rescheduled", description: "Your booking has been updated." });
                setRescheduleBookingId(null);
                fetchBookings();
            } else {
                throw new Error(res.message);
            }
        } catch (error: any) {
            toast({ title: "Reschedule Failed", description: error.message || "An error occurred", variant: "destructive" });
        } finally {
            setIsRescheduling(false);
        }
    };

    const openRescheduleModal = async (booking: Booking) => {
        setRescheduleBookingId(booking.id);
        const today = new Date();
        setRescheduleDate(today);
        setRescheduleSlot("");
        fetchSlotsForDate(today, booking);
    };

    const fetchSlotsForDate = async (date: Date, booking: Booking) => {
        if (!booking.address || !booking.serviceMenus?.[0]) return;
        setIsFetchingSlots(true);
        try {
            // Bypass API and use mock slots
            setTimeout(() => {
                let mockSlots: TimeSlot[] = [
                    { start: "09:00", end: "10:00", available: true },
                    { start: "10:00", end: "11:00", available: true },
                    { start: "11:00", end: "12:00", available: true },
                    { start: "13:00", end: "14:00", available: true },
                    { start: "15:00", end: "16:00", available: true },
                    { start: "16:00", end: "17:00", available: true },
                    { start: "17:00", end: "18:00", available: true },
                    { start: "18:00", end: "19:00", available: true },
                    { start: "19:00", end: "20:00", available: true },
                    { start: "20:00", end: "21:00", available: true }
                ];

                const now = new Date();
                const isToday =
                    date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();

                if (isToday) {
                    const currentHour = now.getHours();
                    const currentMinute = now.getMinutes();
                    mockSlots = mockSlots.filter(slot => {
                        const [slotHour, slotMinute] = slot.start.split(":").map(Number);
                        if (slotHour > currentHour) return true;
                        if (slotHour === currentHour && slotMinute > currentMinute) return true;
                        return false;
                    });
                }

                setAvailableSlots(mockSlots);
                setIsFetchingSlots(false);
            }, 600);
        } catch (error) {
            console.error(error);
            setAvailableSlots([]);
            setIsFetchingSlots(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-sm shadow-2xl">
                <SheetHeader className="px-4 py-4 border-b bg-background/50 backdrop-blur sticky top-0 z-10 text-left flex flex-row items-center gap-3 space-y-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden -ml-2 shrink-0" onClick={() => onOpenChange(false)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <SheetTitle className="text-xl flex items-center gap-2 m-0">
                        <Calendar className="h-5 w-5 text-primary hidden sm:block" />
                        My Bookings
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                        View and manage your service bookings.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6 py-6 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                            <p className="text-sm text-muted-foreground">Loading your bookings...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4">
                            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-4 rounded-xl flex flex-col items-center text-center gap-2 w-full">
                                <AlertCircle className="w-6 h-6 shrink-0" />
                                <span className="font-medium">{error}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={fetchBookings} className="mt-4 text-primary">
                                Try Again
                            </Button>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                            <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
                            <h3 className="font-semibold text-lg text-foreground">No bookings yet</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                Looks like you haven't booked any services yet. Explore our categories to get started!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-10">
                            {bookings.map((booking, index) => (
                                <div key={booking.id} className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all">
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium mb-1">
                                                    Booking #{bookings.length - index}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm font-semibold">
                                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {booking.bookingDate && !isNaN(new Date(booking.bookingDate).getTime())
                                                        ? format(new Date(booking.bookingDate), "MMM d, yyyy")
                                                        : "Date not available"}
                                                    <span className="mx-1 text-muted-foreground/60 font-normal">at</span>
                                                    {booking.timeSlot ? format(new Date(`2000-01-01T${booking.timeSlot}`), "hh:mm a") : "Time not specified"}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className={getStatusColor(booking.status)}>
                                                {booking.status}
                                            </Badge>
                                        </div>

                                        <Separator />

                                        <div className="space-y-2">
                                            {booking.serviceMenus && Array.isArray(booking.serviceMenus) && booking.serviceMenus.length > 0 ? (
                                                booking.serviceMenus.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-foreground">
                                                            {item.title} <span className="text-muted-foreground">x{item.quantity}</span>
                                                        </span>
                                                        <span className="font-medium">₹{Number(item.basePriceInPaisa) / 100 * item.quantity}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-sm text-muted-foreground italic">No items details available</div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-dashed mt-1">
                                            <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                                            <span className="text-lg font-bold text-primary">₹{Number(booking.finalAmountInPaisa) / 100}</span>
                                        </div>

                                        {booking.status.toLowerCase() === 'completed' && (
                                            <div className="pt-2">
                                                <Button
                                                    variant="outline"
                                                    className="w-full gap-2 text-primary border-primary/20 hover:bg-primary/5"
                                                    onClick={() => setRatingBookingId(booking.id)}
                                                >
                                                    <Star className="w-4 h-4" />
                                                    Rate Service
                                                </Button>
                                            </div>
                                        )}

                                        {(booking.status.toLowerCase() === 'pending' || booking.status.toLowerCase() === 'confirmed') && (
                                            <div className="pt-3 grid grid-cols-2 gap-2 mt-2 border-t border-dashed">
                                                <Button
                                                    variant="outline"
                                                    className="w-full gap-1.5 text-gray-700 hover:text-gray-900"
                                                    onClick={() => openRescheduleModal(booking)}
                                                >
                                                    <CalendarClock className="w-4 h-4" />
                                                    Reschedule
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="w-full gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                    onClick={() => {
                                                        setCancelBookingId(booking.id);
                                                        setCancelReason("");
                                                    }}
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 pt-2">
                                            {booking.paymentMode && (
                                                <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                    {booking.paymentMode}
                                                </span>
                                            )}
                                            {booking.paymentStatus && (
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                                                    booking.paymentStatus.toLowerCase() === 'paid' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                                )}>
                                                    {booking.paymentStatus}
                                                </span>
                                            )}
                                        </div>

                                        {booking.vendor && (
                                            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2 mt-2">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                                                    <User className="w-3.5 h-3.5" />
                                                    Service Provider Assigned
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-foreground">{booking.vendor.name}</span>
                                                    <a href={`tel:${booking.vendor.phoneNo}`} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                                                        <Phone className="w-3 h-3" />
                                                        {booking.vendor.phoneNo}
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {booking.address && (
                                            <div className="bg-secondary/30 rounded-lg p-2.5 flex gap-2 text-xs mt-2">
                                                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {[booking.address.addressLine1, booking.address.addressLine2, booking.address.city]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Rating Modal Wrapper */}
                {ratingBookingId && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Rate Your Service</h3>
                            </div>
                            <form onSubmit={handleRateSubmit} className="space-y-5">
                                <div className="space-y-2 text-center flex flex-col items-center">
                                    <label className="text-sm font-medium text-gray-700">How was your experience?</label>
                                    <div className="flex gap-2 justify-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRatingData({ ...ratingData, rating: star })}
                                                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star className={cn("w-8 h-8", star <= ratingData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Add a written review (optional)</label>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none min-h-[100px] resize-none"
                                        placeholder="Tell us what you liked or what could be improved..."
                                        value={ratingData.reviewText}
                                        onChange={(e) => setRatingData({ ...ratingData, reviewText: e.target.value })}
                                        maxLength={1000}
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setRatingBookingId(null)}>Cancel</Button>
                                    <Button type="submit" className="flex-1" disabled={isSubmittingRating}>
                                        {isSubmittingRating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Submit
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Cancel Booking Modal */}
                {cancelBookingId && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center gap-3 mb-2 text-red-600">
                                <AlertCircle className="w-6 h-6" />
                                <h3 className="text-lg font-bold">Cancel Booking</h3>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">Are you sure you want to cancel this booking? Please provide a reason.</p>

                            <form onSubmit={handleCancelSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cancelReason">Reason for cancellation</Label>
                                    <Input
                                        id="cancelReason"
                                        placeholder="e.g., Change of plans, found alternative..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setCancelBookingId(null)} disabled={isCanceling}>Keep Booking</Button>
                                    <Button type="submit" variant="destructive" className="flex-1" disabled={isCanceling || !cancelReason.trim()}>
                                        {isCanceling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Cancel It"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reschedule Booking Modal */}
                {rescheduleBookingId && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <CalendarClock className="w-5 h-5 text-primary" />
                                    Reschedule Booking
                                </h3>
                            </div>

                            <div className="space-y-4 overflow-y-auto pr-2 pb-2">
                                <div className="space-y-2">
                                    <Label>Select New Date</Label>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-1">
                                        {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                                            const date = addDays(new Date(), offset);
                                            const isSelected = rescheduleDate && format(date, "yyyy-MM-dd") === format(rescheduleDate, "yyyy-MM-dd");
                                            return (
                                                <button
                                                    key={offset}
                                                    onClick={() => {
                                                        setRescheduleDate(date);
                                                        setRescheduleSlot("");
                                                        const booking = bookings.find(b => b.id === rescheduleBookingId);
                                                        if (booking) fetchSlotsForDate(date, booking);
                                                    }}
                                                    className={cn(
                                                        "flex flex-col items-center min-w-[4.5rem] p-2.5 rounded-lg border-2 transition-all",
                                                        isSelected
                                                            ? "border-primary bg-primary/5 text-primary"
                                                            : "border-gray-100 bg-white hover:border-gray-200 text-gray-600"
                                                    )}
                                                >
                                                    <span className="text-xs font-medium uppercase tracking-wider mb-1">
                                                        {format(date, "EEE")}
                                                    </span>
                                                    <span className={cn("text-lg font-bold tracking-tight leading-none", isSelected ? "text-primary" : "text-gray-900")}>
                                                        {format(date, "d")}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 mt-1">
                                                        {format(date, "MMM")}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label>Select New Time</Label>
                                    {isFetchingSlots ? (
                                        <div className="flex items-center justify-center p-6 text-gray-400">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            <span className="text-sm">Finding slots...</span>
                                        </div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-sm text-center p-6 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-100 text-gray-500">
                                            No slots available for this date.<br />Please pick another day.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                            {availableSlots.map((slot) => {
                                                const [hours, minutes] = slot.start.split(":");
                                                const slotTime = new Date();
                                                slotTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                                                return (
                                                    <button
                                                        key={slot.start}
                                                        onClick={() => setRescheduleSlot(slot.start)}
                                                        disabled={!slot.available}
                                                        className={cn(
                                                            "py-2.5 px-3 rounded-lg text-sm font-medium transition-all border text-center flex items-center justify-center",
                                                            !slot.available ? "opacity-40 cursor-not-allowed bg-gray-50 border-gray-100" :
                                                                rescheduleSlot === slot.start
                                                                    ? "bg-primary text-white border-primary shadow-sm"
                                                                    : "bg-white text-gray-700 border-gray-200 hover:border-primary/40 hover:bg-primary/5"
                                                        )}
                                                    >
                                                        {format(slotTime, "h:mm a")}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 mt-auto border-t">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setRescheduleBookingId(null)} disabled={isRescheduling}>Cancel</Button>
                                <Button
                                    onClick={handleRescheduleSubmit}
                                    className="flex-1"
                                    disabled={isRescheduling || !rescheduleDate || !rescheduleSlot}
                                >
                                    {isRescheduling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm New Time"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
