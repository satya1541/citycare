import { Header } from "@/components/header";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, MapPin, CreditCard, ShieldCheck, Plus, CheckCircle, Clock, Zap, Calendar, Package, AlertCircle, Phone, ChevronRight, Calculator, User, Minus, Ticket, Check, X } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

import { Link, useLocation } from "wouter";
import { getUserAddresses, Address, loadRazorpay, getServiceMenusGrouped, ServiceMenu, getImageUrl, getWalletBalance, createPaymentOrder, verifyPayment } from "@/lib/services";
import { checkAvailability, getAvailableSlots, createBookingFromCart, scheduleCart, TimeSlot } from "@/lib/bookings";
import { createPayment, verifyPayment as verifyPaymentGateway } from "@/lib/payments";

import { motion, AnimatePresence } from "framer-motion";

export default function Checkout() {
  const { items, total, clearCart, updateQuantity, addItem } = useCart();
  const { user, isAuthenticated, setShowLoginModal } = useAuth();

  const [, setLocation] = useLocation();

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [bookingType, setBookingType] = useState<'instant' | 'scheduled' | null>('scheduled');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'after'>("online");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New State for Redesign
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [avoidCalling, setAvoidCalling] = useState<boolean>(false);
  const [customTip, setCustomTip] = useState<string>("");
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  // Add Address Modal State
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressLine1, setNewAddressLine1] = useState("");
  const [newAddressLine2, setNewAddressLine2] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");
  const [newAddressPincode, setNewAddressPincode] = useState("");
  const [newAddressLabel, setNewAddressLabel] = useState("Home");
  const [newAddressLat, setNewAddressLat] = useState(0);
  const [newAddressLng, setNewAddressLng] = useState(0);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [addressFormError, setAddressFormError] = useState<string | null>(null);

  // Frequently added together suggestions
  const [suggestions, setSuggestions] = useState<(ServiceMenu & { serviceId: number })[]>([]);

  // Initial Loading
  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (isAuthenticated && user) {
      fetchAddresses();
    }
  }, [isAuthenticated, user]);

  // Fetch "Frequently added together" suggestions based on cart items
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (items.length === 0) {
        setSuggestions([]);
        return;
      }

      // Get unique serviceIds from cart
      const serviceIds = Array.from(new Set(items.map(i => i.serviceId).filter(Boolean))) as number[];
      const cartMenuIds = new Set(items.map(i => i.menuId));

      try {
        const allMenus: (ServiceMenu & { serviceId: number })[] = [];

        await Promise.all(
          serviceIds.map(async (serviceId) => {
            const grouped = await getServiceMenusGrouped(serviceId);
            grouped.forEach(group => {
              group.items.forEach(menu => {
                // Only add items NOT already in cart
                if (!cartMenuIds.has(menu.id)) {
                  allMenus.push({ ...menu, serviceId });
                }
              });
            });
          })
        );

        // Shuffle and take up to 6 suggestions
        const shuffled = allMenus.sort(() => 0.5 - Math.random());
        setSuggestions(shuffled.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      }
    };

    fetchSuggestions();
  }, [items]);

  // Fetch Slots on Date Change & Address Change (Only if Scheduled)
  useEffect(() => {
    if (bookingType !== 'scheduled') return;

    const fetchSlots = async () => {
      const selectedAddress = addresses.find(a => a.id === selectedAddressId);
      if (!selectedAddress || !selectedAddress.latitude || !selectedAddress.longitude) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      setError(null);
      try {
        if (items.length > 0) {
          const item = items[0];
          const serviceId = item.serviceId || 1;
          const serviceMenuId = item.menuId;
          const dateStr = format(selectedDate, "yyyy-MM-dd");

          const defaultSlots: TimeSlot[] = [];
          for (let hour = 9; hour <= 20; hour++) {
            const slotTime = `${hour.toString().padStart(2, '0')}:00`;
            defaultSlots.push({
              start: slotTime,
              end: `${(hour + 1).toString().padStart(2, '0')}:00`,
              available: true
            });
          }

          const data = await getAvailableSlots(
            serviceId,
            serviceMenuId,
            dateStr,
            selectedAddress.latitude,
            selectedAddress.longitude
          );

          let finalSlots = defaultSlots;
          const now = new Date();
          const isToday = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

          if (isToday) {
            finalSlots = finalSlots.filter(slot => {
              const [h, m] = slot.start.split(':').map(Number);
              const slotDate = new Date(now);
              slotDate.setHours(h, m, 0, 0);
              return slotDate.getTime() > (now.getTime() + 60 * 60 * 1000);
            });
          }

          setAvailableSlots(finalSlots);
        }
      } catch (error) {
        console.error("Failed to fetch slots", error);
        setError("Failed to load time slots. Please try different address or date.");
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedAddressId, items, bookingType, addresses]);


  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const data = await getUserAddresses(user.id);
      setAddresses(data);
      if (data.length > 0) {
        const defaultAddr = data.find(a => a.isDefault);
        setSelectedAddressId(defaultAddr ? defaultAddr.id : data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch addresses", error);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAddressFormError("Geolocation is not supported by your browser.");
      return;
    }
    setIsFetchingLocation(true);
    setAddressFormError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setNewAddressLat(Number(latitude.toFixed(8)));
        setNewAddressLng(Number(longitude.toFixed(8)));
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const road = addr.road || addr.neighbourhood || addr.suburb || "";
          const houseNumber = addr.house_number || "";
          setNewAddressLine1(houseNumber ? `${houseNumber}, ${road}` : road);
          setNewAddressLine2(
            [addr.suburb, addr.neighbourhood, addr.county].filter(Boolean).join(", ")
          );
          setNewAddressCity(addr.city || addr.town || addr.village || addr.state_district || "");
          setNewAddressPincode(addr.postcode || "");
          setAddressFormError(null);
        } catch {
          setAddressFormError("Could not fetch address details. Please fill in manually.");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (err) => {
        setIsFetchingLocation(false);
        setAddressFormError(err.message || "Failed to get your location. Please allow location access and try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleAddAddress = async () => {
    if (!user || !newAddressLine1.trim()) return;
    setIsAddingAddress(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("https://citycare.thynxai.cloud/api/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          fullName: user.fullName || "",
          phoneNo: user.phoneNo || "",
          addressLine1: newAddressLine1.trim(),
          addressLine2: newAddressLine2.trim(),
          city: newAddressCity.trim(),
          pincode: newAddressPincode.trim(),
          label: newAddressLabel,
          latitude: newAddressLat,
          longitude: newAddressLng
        }),
      });
      if (!res.ok) throw new Error("Failed to add address");

      setAddressFormError(null);
      setShowAddAddressModal(false);
      setNewAddressLine1("");
      setNewAddressLine2("");
      setNewAddressCity("");
      setNewAddressPincode("");
      setNewAddressLabel("Home");
      setNewAddressLat(0);
      setNewAddressLng(0);
      await fetchAddresses();
    } catch (error) {
      console.error(error);
      setAddressFormError("Failed to add address. Please try again.");
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleAddressSelect = (id: number) => {
    setSelectedAddressId(id);
  };

  const handleTypeSelect = (type: 'instant' | 'scheduled') => {
    setBookingType(type);
    if (type === 'instant') {
      const now = new Date();
      const timeIn30 = addMinutes(now, 30);
      setSelectedSlot({
        start: format(timeIn30, "HH:mm"),
        end: format(addMinutes(timeIn30, 60), "HH:mm"),
        available: true
      });
      setStep(3);
    } else {
      setSelectedSlot(null);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddressId || !selectedSlot) {
      setError("Please select both an address and a time slot to proceed.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const scheduledDate = format(selectedDate, "yyyy-MM-dd");
      const scheduledTime = selectedSlot.start;
      const serviceId = items[0]?.serviceId || 1;
      const serviceMenuId = items[0]?.menuId;

      const itemTotal = total;
      const taxesAndFee = 49;
      const finalAmount = itemTotal + taxesAndFee + tipAmount;

      /* 
      // 1. Pre-Booking Availability Check
      const address = addresses.find(a => a.id === selectedAddressId);
      if (address) {
        const availRes = await fetch(`https://citycare.thynxai.cloud/api/bookings/check-availability?serviceMenuId=${serviceMenuId}&serviceId=${serviceId}&latitude=${address.latitude}&longitude=${address.longitude}&bookingDate=${scheduledDate}&timeSlot=${scheduledTime}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const availData = await availRes.json();
        if (!availData.success || !availData.data || !availData.data.available) {
          setStep(2); // Kick them back to slot selection
          throw new Error(availData.message || "Sorry, this time slot is no longer available. Please select another time.");
        }
      }
      */

      await scheduleCart(user.id, serviceId!, scheduledDate, scheduledTime, selectedAddressId);

      // Create booking first to get a bookingId for the payment reference
      const bookingRes = await createBookingFromCart(user.id, {
        serviceId: serviceId!,
        paymentMethod: paymentMethod === 'online' ? 'PAY_NOW' : 'PAY_AFTER'
      });

      if (!bookingRes || !bookingRes.success) {
        throw new Error(bookingRes?.message || "Failed to create booking.");
      }

      const bookingId = bookingRes?.data?.bookings?.[0]?.id;

      if (paymentMethod === 'online') {
        const receipt = `booking_${user.id}_${Date.now()}`;
        // Pass bookingId as referenceId to link payment to booking
        const paymentRes = await createPaymentOrder(finalAmount * 100, bookingId, receipt);
        if (!paymentRes.success) throw new Error("Failed to initialize payment");

        const res = await loadRazorpay();
        if (!res) throw new Error("Razorpay SDK failed to load");

        // Simple and robust data extraction (matching working wallet-drawer logic)
        const orderData = paymentRes.data || paymentRes;

        const razorKey = orderData.razorpayKey || orderData.key || "rzp_test_Rd82dGLg9aCywP";
        const razorAmount = orderData.amountInPaisa || orderData.amount;
        const razorOrderId = orderData.razorpayOrderId || orderData.id;

        const options = {
          key: razorKey,
          amount: razorAmount,
          currency: orderData.currency || "INR",
          name: "City Care Connect",
          description: "Service Booking",
          order_id: razorOrderId,
          handler: async function (response: any) {
            try {
              await verifyPayment({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              });

              await clearCart();
              setLocation(`/booking-success?bookingId=${bookingId}`);
            } catch (error) {
              console.error("Verification Error", error);
              setError("Payment verification failed. Please contact support.");
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: user.fullName || "",
            email: user.email || "",
            contact: user.phoneNo || ""
          },
          theme: {
            color: "#0F172A",
          },
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();

      } else {
        // PAY_AFTER flow: Booking is already created above
        await clearCart();
        setLocation(`/booking-success?bookingId=${bookingId}`);
        setIsProcessing(false);
      }

    } catch (error: any) {
      console.error("Booking Error", error);
      setError(error.message || "Failed to place order. Please try again.");
      setIsProcessing(false);
    }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  // Calculate final amount
  const itemTotal = total;
  const taxesAndFee = 49;
  const finalAmount = itemTotal + taxesAndFee + tipAmount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background font-sans flex flex-col">
        <Header />
        <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6"
          >
            <Clock className="h-10 w-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md">Looks like you haven't added any services yet.</p>
          <Link href="/">
            <Button size="lg" className="min-w-[200px] h-12 text-lg">
              Browse Services
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-red-800">Booking cannot be processed</h3>
              <p className="text-sm text-red-700 mt-1 leading-snug">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start pb-20 lg:pb-0">

          {/* LEFT COLUMN - STEPS */}
          <div className="flex flex-col">

            {/* Single Compact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

              {/* User Info Section */}
              <div className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Send booking details to</h3>
                  <p className="text-sm text-gray-600 truncate">{user?.phoneNo ? `+91 ${user.phoneNo}` : "No phone number"}</p>
                </div>
              </div>

              <Separator />

              {/* Address Section */}
              <div className="p-4">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setStep(1)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step > 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {step > 1 ? <CheckCircle className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">Address</h3>
                    {selectedAddressId && step !== 1 && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {addresses.find(a => a.id === selectedAddressId)?.addressLine1}
                      </p>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {step === 1 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="mt-3 space-y-3">
                        {addresses.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-gray-500 text-sm mb-3">You haven't added any addresses yet.</p>
                            <Button variant="outline" className="w-full" onClick={() => setShowAddAddressModal(true)}>
                              <Plus className="w-4 h-4 mr-2" /> Add New Address
                            </Button>
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {addresses.map((address) => (
                              <div
                                key={address.id}
                                onClick={() => setSelectedAddressId(address.id)}
                                className={cn(
                                  "relative p-3 rounded-lg border-2 transition-all cursor-pointer hover:border-gray-300",
                                  selectedAddressId === address.id ? "border-primary bg-primary/5" : "border-gray-100 bg-white"
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <MapPin className={cn("w-4 h-4 mt-0.5", selectedAddressId === address.id ? "text-primary" : "text-gray-400")} />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">{address.type || "Home"}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 break-words">{address.addressLine1}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 truncate">{address.city}, {address.state} - {address.pincode}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary hover:bg-primary/10 text-sm" onClick={() => setShowAddAddressModal(true)}>
                              <Plus className="w-4 h-4 mr-2" /> Add Another Address
                            </Button>
                          </div>
                        )}

                        <Button
                          disabled={!selectedAddressId}
                          onClick={() => setStep(2)}
                          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                        >
                          Select address
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator />

              {/* Slot Section */}
              <div className="p-4">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => selectedAddressId && setStep(2)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step > 2 ? 'bg-green-500 text-white' : step >= 2 ? 'bg-gray-100 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    {step > 2 ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold ${step >= 2 ? 'text-gray-900' : 'text-gray-400'} truncate`}>Slot</h3>
                    {selectedSlot && step !== 2 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {bookingType === 'instant' ? "Instant (~30 mins)" : `${format(selectedDate, "EEE, MMM d")} at ${format(new Date(`2000-01-01T${selectedSlot.start}`), "h:mm a")}`}
                      </p>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {step === 2 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="mt-3 space-y-4">
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-full">
                          {/* 
                           <button
                             onClick={() => setBookingType('instant')}
                             className={cn(
                               "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                               bookingType === 'instant' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-900"
                             )}
                           >
                             <Zap className="w-4 h-4 inline-block mr-1 mb-0.5" /> Instant
                           </button>
                           */}
                          <button
                            onClick={() => setBookingType('scheduled')}
                            className={cn(
                              "w-full py-2 text-sm font-medium rounded-md bg-white text-primary shadow-sm"
                            )}
                          >
                            <Calendar className="w-4 h-4 inline-block mr-1 mb-0.5" /> Schedule Service
                          </button>
                        </div>

                        {/* {bookingType === 'instant' ? (
                          <div className="text-center py-6">
                            <Zap className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                            <h4 className="font-semibold text-gray-900 text-sm">Arriving in 45 mins</h4>
                            <p className="text-xs text-gray-500 mt-1">A professional will be assigned immediately.</p>
                            <Button className="mt-3 w-full" onClick={() => {
                              setSelectedDate(new Date());
                              setSelectedSlot({ start: format(addMinutes(new Date(), 45), "HH:mm"), end: "", available: true });
                              setStep(3);
                            }}>
                              Confirm Instant Booking
                            </Button>
                          </div>
                        ) : ( */}
                        <div className="space-y-3">
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {[0, 1, 2, 3].map((offset) => {
                              const date = new Date();
                              date.setDate(date.getDate() + offset);
                              const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                              return (
                                <button
                                  key={offset}
                                  onClick={() => {
                                    setSelectedDate(date);
                                    setAvailableSlots([]);
                                    setSelectedSlot(null);
                                  }}
                                  className={cn(
                                    "flex flex-col items-center min-w-[4rem] p-2.5 rounded-lg border-2 transition-all",
                                    isSelected ? "border-primary bg-primary/5 text-primary" : "border-gray-100 text-gray-500 hover:border-gray-200"
                                  )}
                                >
                                  <span className="text-xs font-medium uppercase">{offset === 0 ? "Today" : format(date, "EEE")}</span>
                                  <span className="font-bold text-lg">{format(date, "d")}</span>
                                </button>
                              )
                            })}
                          </div>

                          {loadingSlots ? (
                            <div className="grid grid-cols-3 gap-2">
                              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-9 bg-gray-100 animate-pulse rounded-md" />)}
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {availableSlots.length > 0 ? availableSlots.map((slot, i) => (
                                <button
                                  key={i}
                                  disabled={!slot.available}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={cn(
                                    "py-2 px-1 rounded-md text-xs font-medium border transition-all",
                                    selectedSlot?.start === slot.start
                                      ? "bg-primary text-white border-primary"
                                      : slot.available
                                        ? "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                                        : "bg-gray-50 text-gray-300 border-transparent cursor-not-allowed"
                                  )}
                                >
                                  {format(new Date(`2000-01-01T${slot.start}`), "h:mm a")}
                                </button>
                              )) : (
                                <div className="col-span-full text-center py-3 text-gray-500 text-xs">
                                  Select a date to view available slots.
                                </div>
                              )}
                            </div>
                          )}

                          <Button
                            disabled={!selectedSlot}
                            onClick={() => setStep(3)}
                            className="w-full"
                          >
                            Continue to Payment
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Separator />

              {/* Payment Method Section */}
              <div className="p-4">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => selectedSlot && setStep(3)}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${step === 3 ? 'bg-gray-100 text-primary' : 'bg-gray-100 text-gray-400'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold ${step >= 3 ? 'text-gray-900' : 'text-gray-400'} truncate`}>Payment Method</h3>
                    {step === 3 && <p className="text-xs text-gray-500">Select how you want to pay</p>}
                  </div>
                </div>

                <AnimatePresence>
                  {step === 3 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="mt-3 space-y-3">
                        <div
                          onClick={() => setPaymentMethod('online')}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                            paymentMethod === 'online' ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"
                          )}
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">Pay Online</h4>
                            <p className="text-xs text-gray-500 truncate">Cards, UPI, Netbanking</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-primary' : 'border-gray-300'}`}>
                            {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                        </div>

                        <div
                          onClick={() => setPaymentMethod('after')}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                            paymentMethod === 'after' ? "border-primary bg-primary/5" : "border-gray-100 hover:border-gray-200"
                          )}
                        >
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">Pay After Service</h4>
                            <p className="text-xs text-gray-500 truncate">Cash or Online after job is done</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'after' ? 'border-primary' : 'border-gray-300'}`}>
                            {paymentMethod === 'after' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sticky Cancellation Policy on Desktop */}
            <div className="relative lg:sticky lg:bottom-0 bg-gray-50/50 pt-6">
              <h4 className="text-lg font-bold text-gray-900 mb-1">Cancellation policy</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Free cancellations if done more than 12 hrs before the service. A fee will be charged otherwise.
              </p>
              <button className="text-sm font-semibold text-gray-900 underline mt-2">Read full policy</button>
            </div>

          </div>

          {/* RIGHT COLUMN - SUMMARY */}
          <div className="space-y-6">

            {/* Order Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-5 lg:sticky lg:top-24">
              {items.length > 0 && (
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
              )}

              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="text-sm font-medium text-gray-900 break-words">{item.name}</h4>
                        <span className="text-sm font-medium text-gray-900 shrink-0">₹{item.price * item.quantity}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>• {item.description || "Service included"}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Quantity Control */}
                        <div className="flex items-center border border-[#E2E8F0] rounded-lg h-8 bg-white">
                          <button
                            className="w-8 h-full flex items-center justify-center text-[#7C3AED] hover:bg-[#F3E8FF] rounded-l-lg transition-colors"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 flex items-center justify-center text-sm font-medium text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            className="w-8 h-full flex items-center justify-center text-[#7C3AED] hover:bg-[#F3E8FF] rounded-r-lg transition-colors"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="text-sm font-medium underline text-gray-900">Edit package</button>
              </div>

              <Separator className="my-6" />

              {suggestions.length > 0 && (
                <SuggestionsCarousel suggestions={suggestions} addItem={addItem} />
              )}

              <Separator className="my-6" />

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAvoidCalling(!avoidCalling)}
                  className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    avoidCalling ? "bg-black border-black text-white" : "border-gray-300 bg-white"
                  )}
                >
                  {avoidCalling && <Check className="w-3 h-3" />}
                </button>
                <span className="text-sm text-gray-700">Avoid calling before reaching the location</span>
              </div>

              <Separator className="my-6" />

              <button onClick={() => setShowCouponModal(true)} className="w-full flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Coupons and offers</span>
                </div>
                <div className="flex items-center gap-1 text-[#7C3AED] font-medium text-sm">
                  7 offers <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <Separator className="my-6" />

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment summary</h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Item total</span>
                  <span>₹{itemTotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxes and Fee</span>
                  <span>₹{taxesAndFee}</span>
                </div>
                {tipAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Tip added</span>
                    <span>₹{tipAmount}</span>
                  </div>
                )}
              </div>

              <Separator className="mb-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-900">Total amount</span>
                <span className="font-bold text-gray-900">₹{finalAmount}</span>
              </div>

              <div className="flex justify-between items-center mb-6 text-[#7C3AED] font-bold text-sm">
                <span>Amount to pay</span>
                <span>₹{finalAmount}</span>
              </div>

              {/* Tip Section */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Add a tip to thank the Professional</h4>
                <div className="flex gap-2">
                  {[50, 75, 100].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setTipAmount(amount === tipAmount ? 0 : amount)}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-sm font-medium transition-all relative overflow-hidden",
                        tipAmount === amount
                          ? "border-green-500 bg-green-50 text-green-700 font-bold"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      )}
                    >
                      ₹{amount}
                      {amount === 75 && <span className="absolute top-0 right-0 text-[8px] bg-green-100 text-green-800 px-1 rounded-bl">POPULAR</span>}
                    </button>
                  ))}
                  <button
                    onClick={() => setTipAmount(0)} // Placeholder for custom logic
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300"
                  >
                    Custom
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">100% of the tip goes to the professional.</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

            </div>

            {/* Fixed Bottom Bar on Mobile, Sticky on Desktop */}
            <div className="fixed bottom-0 left-0 right-0 z-40 lg:sticky lg:bottom-0 bg-white border-t border-gray-200 px-5 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-bold text-gray-900">Amount to pay</span>
                <span className="text-base font-bold text-gray-900">₹{finalAmount}</span>
              </div>
              <Button
                disabled={isProcessing}
                onClick={handlePlaceOrder}
                className="w-full h-11 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold shadow-sm"
              >
                {isProcessing ? "Processing..." : "Proceed to pay"}
              </Button>
              <button className="w-full text-center text-xs text-[#7C3AED] font-medium mt-2 hover:underline">
                View breakup
              </button>
            </div>
          </div>

        </div>
      </main >
      {/* Coupons & Offers Modal */}
      <AnimatePresence>
        {
          showCouponModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[60]"
                onClick={() => setShowCouponModal(false)}
              />
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Coupons & Offers</h2>
                    <button
                      onClick={() => setShowCouponModal(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto">
                    {/* Coupon Code Input */}
                    <div className="px-5 pt-4 pb-3">
                      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <input
                          type="text"
                          placeholder="Enter Coupon Code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="flex-1 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                        />
                        <button className="px-4 py-3 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                          Apply
                        </button>
                      </div>
                    </div>

                    {/* Coupon Offers */}
                    <div className="px-5 divide-y divide-gray-100">
                      {[
                        {
                          icon: "🎉",
                          title: "Get 25% off upto 200",
                          subtitle: "For new users",
                          savings: "SAVE ₹200 ON THIS ORDER",
                          code: "WELCOME25"
                        },
                        {
                          icon: "%",
                          iconBg: "bg-green-100 text-green-600",
                          title: "Get ₹50 coupon",
                          subtitle: "After first service delivery",
                          savings: "SAVE ₹50 ON THIS ORDER",
                          code: "FIRST50"
                        },
                        {
                          icon: "🎁",
                          title: "Flat ₹150 off",
                          subtitle: "On orders above ₹999",
                          savings: "SAVE ₹150 ON THIS ORDER",
                          code: "FLAT150"
                        },
                      ].map((coupon, idx) => (
                        <div key={idx} className="py-4 flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${coupon.iconBg || 'bg-purple-50'}`}>
                            {coupon.icon === "%" ? <Ticket className="w-5 h-5" /> : coupon.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900">{coupon.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{coupon.subtitle}</p>
                            <p className="text-xs font-bold text-green-600 mt-1">{coupon.savings}</p>
                            <button className="text-xs font-semibold text-gray-900 underline mt-1">View T&C</button>
                          </div>
                          <button className="text-sm font-bold text-[#7C3AED] hover:text-[#6D28D9] shrink-0 pt-1">
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Payment Offers Section */}
                    <div className="mt-2 border-t border-gray-200">
                      <div className="px-5 pt-4 pb-2">
                        <h3 className="text-lg font-bold text-gray-900">Payment offers</h3>
                        <p className="text-xs text-gray-500 mt-0.5">No code required</p>
                      </div>

                      <div className="px-5 divide-y divide-gray-100 pb-4">
                        {[
                          {
                            icon: "💳",
                            iconBg: "bg-yellow-50",
                            title: "Amazon cashback upto ₹100",
                            subtitle: "Via Amazon Pay balance"
                          },
                          {
                            icon: "🏦",
                            iconBg: "bg-red-50",
                            title: "Flat ₹100 cashback",
                            subtitle: "Via RuPay CC on POP app"
                          },
                          {
                            icon: "💰",
                            iconBg: "bg-blue-50",
                            title: "10% cashback upto ₹75",
                            subtitle: "Via Mobikwik wallet"
                          },
                          {
                            icon: "🎯",
                            iconBg: "bg-green-50",
                            title: "Flat ₹50 off",
                            subtitle: "Via PhonePe UPI"
                          }
                        ].map((offer, idx) => (
                          <div key={idx} className="py-4 flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg ${offer.iconBg}`}>
                              {offer.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-gray-900">{offer.title}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{offer.subtitle}</p>
                              <button className="text-xs font-semibold text-gray-900 underline mt-1">View T&C</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )
        }
      </AnimatePresence >

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddAddressModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => setShowAddAddressModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Add New Address</h2>
                  <button
                    onClick={() => setShowAddAddressModal(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Form */}
                <div className="p-5 space-y-4">
                  {/* Use Current Location */}
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={isFetchingLocation}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-[#7C3AED] text-[#7C3AED] font-semibold text-sm hover:bg-[#F3E8FF] transition-colors disabled:opacity-60"
                  >
                    {isFetchingLocation ? (
                      <><div className="w-4 h-4 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" /> Detecting location...</>
                    ) : (
                      <><MapPin className="w-4 h-4" /> Use Current Location</>
                    )}
                  </button>

                  {/* Inline Error */}
                  {addressFormError && (
                    <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span className="text-sm">{addressFormError}</span>
                    </div>
                  )}

                  {/* Label Selector */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Address Type</label>
                    <div className="flex gap-2">
                      {["Home", "Work", "Other"].map((label) => (
                        <button
                          key={label}
                          onClick={() => setNewAddressLabel(label)}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all",
                            newAddressLabel === label
                              ? "border-[#7C3AED] bg-[#F3E8FF] text-[#7C3AED]"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address Line 1 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Address Line 1 *</label>
                    <input
                      type="text"
                      placeholder="e.g. House No, Street Name"
                      value={newAddressLine1}
                      onChange={(e) => setNewAddressLine1(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-colors"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">Address Line 2</label>
                    <input
                      type="text"
                      placeholder="e.g. Landmark, Area"
                      value={newAddressLine2}
                      onChange={(e) => setNewAddressLine2(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-colors"
                    />
                  </div>

                  {/* City & Zip Code */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={newAddressCity}
                        onChange={(e) => setNewAddressCity(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1.5 block">Zip Code</label>
                      <input
                        type="text"
                        placeholder="e.g. 400001"
                        value={newAddressPincode}
                        onChange={(e) => setNewAddressPincode(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleAddAddress}
                    disabled={!newAddressLine1.trim() || isAddingAddress}
                    className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold"
                  >
                    {isAddingAddress ? "Adding..." : "Save Address"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div >
  );
}

// Auto-sliding suggestions carousel
function SuggestionsCarousel({
  suggestions,
  addItem,
}: {
  suggestions: (ServiceMenu & { serviceId: number })[];
  addItem: (item: any) => Promise<void>;
}) {
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const [visible, setVisible] = useState(2);
  const count = suggestions.length;

  useEffect(() => {
    const handleResize = () => setVisible(window.innerWidth < 400 ? 1 : 2);
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clone first `visible` items for seamless loop
  const extendedItems = count > visible ? [...suggestions, ...suggestions.slice(0, visible)] : suggestions;
  const totalSlides = count;

  const goNext = useCallback(() => {
    if (count <= visible) return;
    setIsAnimating(true);
    setOffset((prev) => prev + 1);
  }, [count]);

  // Snap back when reaching cloned region
  useEffect(() => {
    if (offset === totalSlides && count > visible) {
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setOffset(0);
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [offset, totalSlides, count]);

  // Auto-play
  useEffect(() => {
    if (count <= visible || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(goNext, 3000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, goNext, isPaused]);

  const itemCount = extendedItems.length;
  const trackWidth = (itemCount / visible) * 100;
  const shiftPct = (offset / itemCount) * 100;
  const gapPx = 12;

  return (
    <>
      <h4 className="text-sm font-semibold text-gray-900 mb-3">Frequently added together</h4>
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="overflow-hidden">
          <div
            className={`flex ${isAnimating ? 'transition-transform duration-600 ease-in-out' : ''}`}
            style={{
              width: count > visible ? `${trackWidth}%` : '100%',
              gap: `${gapPx}px`,
              transform: count > visible ? `translateX(calc(-${shiftPct}% - ${offset * (gapPx / itemCount)}px))` : 'none',
            }}
          >
            {extendedItems.map((menu, idx) => (
              <div
                key={`${menu.id}-${idx}`}
                className="flex-shrink-0"
                style={{
                  width: count > visible
                    ? `calc(${100 / itemCount}% - ${((itemCount - 1) * gapPx) / itemCount}px)`
                    : `calc(50% - ${gapPx / 2}px)`,
                }}
              >
                <div className="p-2 border rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                    <img
                      src={getImageUrl(menu.imagePath)}
                      alt={menu.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1">{menu.title}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs font-bold">₹{Math.round(menu.basePriceInPaisa / 100)}</span>
                      <button
                        className="text-[10px] font-bold text-[#7C3AED] bg-[#F3E8FF] px-2 py-0.5 rounded hover:bg-[#EDE0FF] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          addItem({
                            id: String(menu.id),
                            name: menu.title,
                            price: menu.basePriceInPaisa / 100,
                            image: getImageUrl(menu.imagePath),
                            menuId: menu.id,
                            serviceId: menu.serviceId,
                          });
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
