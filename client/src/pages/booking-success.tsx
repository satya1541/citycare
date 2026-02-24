import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, MapPin, Package, Clock, User, Banknote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBookingDetails, getUserBookings } from "@/lib/bookings";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

export default function BookingSuccess() {
    const [bookingId, setBookingId] = useState<string | null>(null);
    const { setShowBookingsDrawer } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        setBookingId(queryParams.get("bookingId"));
    }, []);

    const { data: bookingDetails, isLoading: isBookingLoading } = useQuery({
        queryKey: ["booking", bookingId],
        queryFn: () => getBookingDetails(Number(bookingId)),
        enabled: !!bookingId,
    });

    const { user } = useAuth();
    const { data: userBookingsData, isLoading: isBookingsLoading } = useQuery({
        queryKey: ["user-bookings", user?.id],
        queryFn: () => getUserBookings(user!.id),
        enabled: !!user?.id,
    });

    const booking = bookingDetails?.data;
    const userBookings = userBookingsData?.data || [];

    // Find the sequential number (index in created order)
    const sequentialNumber = userBookings.length > 0 && booking
        ? userBookings.findIndex((b: any) => b.id === booking.id) !== -1
            ? userBookings.length - userBookings.findIndex((b: any) => b.id === booking.id)
            : null
        : null;

    const isLoading = isBookingLoading || isBookingsLoading;

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans pb-12">
            <Header />
            <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center max-w-2xl mt-4">

                {/* Success Icon */}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-200">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
                <p className="text-gray-500 mb-8 text-center max-w-md">
                    Your service request has been received. Our professional will arrive at the scheduled time.
                </p>

                {/* Booking Details Card */}
                <div className="bg-white w-full rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 mt-2 text-left space-y-6">

                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : booking ? (
                        <>
                            {/* Service Block */}
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 p-2.5 rounded-lg shrink-0">
                                    <Package className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5 font-medium">Service Booked</p>
                                    <p className="font-semibold text-gray-900">{booking.service?.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {booking.serviceMenus?.map((menu: any) => `${menu.quantity}x ${menu.title}`).join(', ')}
                                    </p>
                                </div>
                            </div>

                            {/* Date & Time Block */}
                            <div className="flex items-start gap-4 pt-2">
                                <div className="bg-purple-50 p-2.5 rounded-lg shrink-0">
                                    <Calendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5 font-medium">Date & Time</p>
                                    <p className="font-semibold text-gray-900">
                                        {format(new Date(booking.bookingDate), "EEEE, MMMM d, yyyy")}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {format(new Date(`2000-01-01T${booking.timeSlot}`), "h:mm a")} onwards
                                    </p>
                                </div>
                            </div>

                            {/* Location Block */}
                            <div className="flex items-start gap-4 pt-2">
                                <div className="bg-orange-50 p-2.5 rounded-lg shrink-0">
                                    <MapPin className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5 font-medium">Service Address</p>
                                    <p className="font-semibold text-gray-900">
                                        {booking.address?.addressLine1}
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                        {booking.address?.addressLine2}
                                    </p>
                                </div>
                            </div>

                            {/* Amount Block */}
                            <div className="flex items-start gap-4 pt-2">
                                <div className="bg-emerald-50 p-2.5 rounded-lg shrink-0">
                                    <Banknote className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="w-full flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-0.5 font-medium">Amount Paid</p>
                                        <p className="font-bold text-gray-900 text-lg flex items-center gap-1.5">
                                            ₹{(parseInt(booking.finalAmountInPaisa) / 100).toFixed(2)}
                                            {booking.paymentStatus === 'paid' && (
                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                                    Paid
                                                </span>
                                            )}
                                            {booking.paymentStatus !== 'paid' && (
                                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                                    To Pay
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
                                        #{sequentialNumber || booking.id}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <p className="text-gray-500 font-medium">Booking details could not be loaded.</p>
                        </div>
                    )}

                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <Button
                        variant="outline"
                        className="flex-1 max-w-[240px] h-12 text-base font-semibold border-gray-300"
                        onClick={() => {
                            setShowBookingsDrawer(true);
                            // Avoid full page reload so state persists
                            setLocation("/");
                        }}
                    >
                        View Bookings
                    </Button>
                    <Link href="/" className="flex-1 max-w-[240px]">
                        <Button className="w-full h-12 text-base font-semibold shadow-sm">
                            Book Another Service
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
