import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, Crosshair } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import logoImg from "@assets/city-cares-logo-v2.png";
import namasteImg from "@assets/namaste.png";

import heroAc from "@assets/ac.png";
import heroBeauty from "@assets/beauty.png";
import heroKitchen from "@assets/kitchen.png";
import heroMassage from "@assets/massage.png";

const HERO_IMAGES = [heroAc, heroBeauty, heroKitchen, heroMassage];

export default function LoginPage() {
    const { user, login, sendOtp } = useAuth();

    const [, setLocation] = useLocation();

    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user?.fullName && user?.email) {
            setLocation("/");
        }
    }, [user, setLocation]);
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [step, setStep] = useState<"phone" | "otp" | "details" | "address">("phone");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [latitude, setLatitude] = useState<number | string>("");
    const [longitude, setLongitude] = useState<number | string>("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) return;

        setIsLoading(true);
        setError(null);
        try {
            await sendOtp(phone);
            setStep("otp");
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Failed to send OTP. Please retry.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otp.length < 4 || isLoading) return;

        setIsLoading(true);
        setError(null);
        try {
            const loggedInUser = await login(phone, otp);
            if (!loggedInUser?.fullName || !loggedInUser?.email) {
                setStep("details");
            } else {
                setLocation("/");
            }
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Please enter a valid OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-submit OTP when 4 digits are entered
    useEffect(() => {
        if (otp.length === 4 && step === "otp") {
            handleVerify();
        }
    }, [otp, step]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const userStr = localStorage.getItem("user");
            const token = localStorage.getItem("token");
            if (userStr && token) {
                const user = JSON.parse(userStr);
                const res = await fetch(`https://citycare.thynxai.cloud/api/users/${user.id}/customer`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        fullName,
                        email,
                        phoneNo: phone,
                        role: "customer"
                    }),
                });
                if (!res.ok) throw new Error("Failed to update");

                const updatedUser = { ...user, fullName, email };
                localStorage.setItem("user", JSON.stringify(updatedUser));
            }
            setStep("address");
        } catch (error: any) {
            console.error(error);
            setError(error.message || "Failed to update profile.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLatitude(latitude.toFixed(8));
                setLongitude(longitude.toFixed(8));

                // Call Google Maps API to get address lines
                fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyDpyclQV4dQAs4q2UcfnmZ2lwzXPmIVe7E`
                )
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.results && data.results[0]) {
                            const addressComponents = data.results[0].address_components;
                            let streetNumber = "";
                            let route = "";
                            let sublocality = "";

                            addressComponents.forEach((component: any) => {
                                const types = component.types;
                                if (types.includes("street_number")) {
                                    streetNumber = component.long_name;
                                }
                                if (types.includes("route")) {
                                    route = component.long_name;
                                }
                                if (types.includes("sublocality") || types.includes("sublocality_level_1")) {
                                    sublocality = component.long_name;
                                }
                            });

                            setAddressLine1(`${streetNumber} ${route}`.trim());
                            setAddressLine2(sublocality);
                        }
                    })
                    .catch((error) => console.error("Error fetching address:", error))
                    .finally(() => setIsLoading(false));
            },
            (error) => {
                console.error("Error getting location:", error);
                setIsLoading(false);
            }
        );
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        setIsLoading(true);
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
                    fullName: fullName || user.fullName, // Use state or existing
                    phoneNo: phone,
                    addressLine1,
                    addressLine2,
                    label: "Home",
                    latitude: Number(Number(latitude).toFixed(8)),
                    longitude: Number(Number(longitude).toFixed(8))
                }),
            });

            if (!res.ok) throw new Error("Failed to add address");

            setLocation("/");
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full grid lg:grid-cols-2 bg-white font-sans overflow-hidden">
            {/* Left Panel - Hero Image Carousel */}
            <div className="hidden lg:block relative h-full bg-gray-900 overflow-hidden">
                <div className="absolute -top-15 -left-18 z-30">
                    <img src={logoImg} alt="City Cares" className="h-54 w-auto drop-shadow-xl" />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentHeroIndex}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1.0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0"
                    >
                        <img
                            src={HERO_IMAGES[currentHeroIndex]}
                            alt="City Cares Services"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </motion.div>
                </AnimatePresence>

                {/* Optional Branding Overlay on Image */}
                <div className="absolute bottom-12 left-12 z-20 max-w-md">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-2"
                    >
                        <div className="inline-block px-3 py-1 bg-primary/90 text-white rounded-full text-xs font-bold tracking-widest uppercase mb-2">
                            Premium Service
                        </div>
                        <h2 className="text-4xl font-extrabold text-white leading-tight drop-shadow-lg">
                            Trusted by 5 Million+ Customers
                        </h2>
                        <p className="text-gray-200 text-lg opacity-90 drop-shadow-md">
                            Experience the highest quality home services across 50+ cities.
                        </p>
                    </motion.div>
                </div>

                {/* Carousel Indicators */}
                <div className="absolute bottom-6 left-12 z-20 flex gap-2">
                    {HERO_IMAGES.map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-500",
                                i === currentHeroIndex ? "w-8 bg-white" : "w-1.5 bg-white/40"
                            )}
                        />
                    ))}
                </div>
            </div>


            {/* Right Panel - Login Form */}
            <div className="flex flex-col justify-center items-center px-6 lg:px-12 h-full bg-gradient-to-br from-blue-50 to-white relative overflow-y-auto">
                <div className="w-full max-w-md lg:max-w-lg">
                    <h1 className="text-[#0056b3] text-3xl lg:text-4xl font-extrabold leading-tight mb-1 tracking-tight">
                        INSTANT SERVICES<br />
                        AT YOUR DOORSTEP
                    </h1>
                    <h2 className="text-[#0056b3] text-base lg:text-lg font-bold tracking-wide mb-4 uppercase">
                        Delivered Instantly
                    </h2>

                    <p className="text-gray-600 mb-6 text-sm lg:text-base leading-snug">
                        Find verified expert for all your needs - repair, cleaning, beauty and home maintenance.
                        Book quickly, track your service and experience hassle free help at home.
                    </p>

                    {/* Namaste Section */}
                    <div className="flex flex-col items-center mb-6">
                        <img src={namasteImg} alt="Namaste" className="h-30 w-auto mb-2" />
                        <h3 className="text-xl font-bold text-gray-800">Namaste!</h3>
                    </div>

                    <div className="bg-transparent">
                        <AnimatePresence mode="wait">
                            {step === 'phone' && (
                                <motion.form
                                    key="phone"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleLogin}
                                    className="space-y-4"
                                >
                                    <div className="text-center mb-1">
                                        <Label htmlFor="phone" className="text-gray-600 font-normal text-sm">Enter your mobile number to get started</Label>
                                    </div>

                                    <div className="flex bg-white border border-gray-300 rounded-md overflow-hidden shadow-sm hover:border-blue-400 transition-colors h-11">
                                        <div className="flex items-center justify-center px-3 bg-gray-50 border-r text-gray-500 font-medium text-sm">
                                            +91
                                        </div>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="Mobile Number"
                                            className="h-full border-0 focus-visible:ring-0 text-base px-3"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            maxLength={10}
                                            required
                                        />
                                    </div>
                                    {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                                    <Button
                                        className="w-full h-11 bg-[#004e92] hover:bg-[#003d73] text-white text-base font-semibold rounded-md shadow-md transition-all"
                                        disabled={isLoading || phone.length < 10}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Get OTP"}
                                    </Button>
                                </motion.form>
                            )}

                            {step === 'otp' && (
                                <motion.form
                                    key="otp"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleVerify}
                                    className="space-y-4"
                                >
                                    <div className="text-center mb-2">
                                        <p className="text-gray-600 text-sm">Enter the verification code sent to +91 {phone}</p>
                                    </div>

                                    <div className="flex justify-center py-1">
                                        <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                                            <InputOTPGroup className="gap-2">
                                                {[0, 1, 2, 3].map((index) => (
                                                    <InputOTPSlot
                                                        key={index}
                                                        index={index}
                                                        className="h-10 w-10 rounded-md border-gray-300 text-lg bg-white shadow-sm"
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                                    <Button
                                        className="w-full h-11 bg-[#004e92] hover:bg-[#003d73] text-white text-base font-semibold rounded-md shadow-md transition-all mt-2"
                                        disabled={isLoading || otp.length < 4}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify & Login"}
                                    </Button>

                                    <div className="text-center mt-2">
                                        <button type="button" onClick={() => setStep('phone')} className="text-xs text-[#004e92] hover:underline font-medium">
                                            Change Mobile Number
                                        </button>
                                    </div>
                                </motion.form>
                            )}

                            {step === 'details' && (
                                <motion.form
                                    key="details"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleUpdateProfile}
                                    className="space-y-4"
                                >
                                    <div className="text-center mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">Complete Profile</h3>
                                        <p className="text-gray-600 text-xs">Please tell us a bit about yourself</p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-gray-700 text-sm">Full Name</Label>
                                            <Input
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="enter your full name"
                                                className="h-10 bg-white text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-gray-700 text-sm">Email Address</Label>
                                            <Input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="enter your valid email"
                                                className="h-10 bg-white text-sm"
                                                required
                                            />
                                        </div>
                                    </div>
                                    {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                                    <Button
                                        className="w-full h-11 bg-[#004e92] hover:bg-[#003d73] text-white text-base font-semibold rounded-md shadow-md transition-all mt-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Start Booking"}
                                    </Button>
                                </motion.form>
                            )}
                            {step === 'address' && (
                                <motion.form
                                    key="address"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    onSubmit={handleAddAddress}
                                    className="space-y-4"
                                >
                                    <div className="text-center mb-2">
                                        <h3 className="text-lg font-bold text-gray-800">Add Address</h3>
                                        <p className="text-gray-600 text-xs">Where should we provide the service?</p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full gap-2 mb-2 h-10 text-sm border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                        onClick={handleUseCurrentLocation}
                                        disabled={isLoading}
                                    >
                                        <Crosshair className="h-4 w-4" />
                                        Use Current Location
                                    </Button>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="addressLine1" className="text-gray-700 text-sm">Address Line 1</Label>
                                            <Input
                                                id="addressLine1"
                                                value={addressLine1}
                                                onChange={e => setAddressLine1(e.target.value)}
                                                placeholder="House No, Building, Street"
                                                className="h-10 bg-white text-sm"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="addressLine2" className="text-gray-700 text-sm">Address Line 2 (Optional)</Label>
                                            <Input
                                                id="addressLine2"
                                                value={addressLine2}
                                                onChange={e => setAddressLine2(e.target.value)}
                                                placeholder="Area, Landmark"
                                                className="h-10 bg-white text-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label htmlFor="latitude" className="text-gray-700 text-sm">Latitude</Label>
                                                <Input
                                                    id="latitude"
                                                    value={latitude}
                                                    onChange={e => setLatitude(e.target.value)}
                                                    placeholder="20.2961"
                                                    className="h-10 bg-white text-sm"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="longitude" className="text-gray-700 text-sm">Longitude</Label>
                                                <Input
                                                    id="longitude"
                                                    value={longitude}
                                                    onChange={e => setLongitude(e.target.value)}
                                                    placeholder="85.8245"
                                                    className="h-10 bg-white text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                                    <Button
                                        className="w-full h-12 bg-[#004e92] hover:bg-[#003d73] text-white text-lg font-bold rounded-md shadow-lg transition-all mt-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Save & Start Booking"}
                                    </Button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div >
            </div >
        </div >
    );
}
