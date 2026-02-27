import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MapPin, Search, ShoppingCart, User, Menu, X, Clock, TrendingUp, ArrowLeft, Crosshair, History, Calendar, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { getParentServices, getServicesByParent } from "@/lib/services";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImg from "@assets/city-cares-logo-v2.png";

import { ProfileDrawer } from "./profile-drawer";
import { BookingsDrawer } from "./bookings-drawer";
import { WalletDrawer } from "./wallet-drawer";

export function Header() {
  const { itemCount, setIsOpen } = useCart();

  const { user, login, sendOtp, showLoginModal, setShowLoginModal, logout, setShowProfileDrawer, showBookingsDrawer, setShowBookingsDrawer, showWalletDrawer, setShowWalletDrawer, loginReason, setLoginReason } = useAuth();
  const [, navigate] = useLocation();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "details" | "address">("phone");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [latitude, setLatitude] = useState<number | string>("");
  const [longitude, setLongitude] = useState<number | string>("");
  const [userAddress, setUserAddress] = useState("Select location");
  const [error, setError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<{ id: number; name: string; type: 'category' | 'service'; slug?: string; parentName?: string }[]>([]);
  const [searchResults, setSearchResults] = useState<typeof searchIndex>([]);

  // Build search index
  useEffect(() => {
    const buildIndex = async () => {
      try {
        const parents = await getParentServices();
        if (parents && parents.length > 0) {
          const index: typeof searchIndex = [];
          for (const cat of parents) {
            index.push({ id: cat.id, name: cat.name, type: 'category', slug: cat.name.toLowerCase().replace(/\s+/g, '-') });
            const children = await getServicesByParent(cat.id);
            if (children && children.length > 0) {
              children.forEach((svc: any) => {
                index.push({ id: svc.id, name: svc.name, type: 'service', parentName: cat.name });
              });
            }
          }
          setSearchIndex(index);
        }
      } catch (err) {
        console.error("Search indexing failed", err);
      }
    };
    buildIndex();
  }, []);

  // Filter results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = searchIndex.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.parentName?.toLowerCase().includes(query)
    ).slice(0, 8);
    setSearchResults(filtered);
  }, [searchQuery, searchIndex]);

  useEffect(() => {
    if (user) {
      const fetchAddress = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`https://citycare.thynxai.cloud/api/addresses/${user.id}?page=1&limit=1`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.data.records?.length > 0) {
            const addr = data.data.records[0];
            setUserAddress(addr.addressLine2 || addr.addressLine1 || "Select location");
          }
        } catch (error) {
          console.error("Failed to fetch user address", error);
        }
      };
      fetchAddress();
    } else {
      setUserAddress("Select location");
    }
  }, [user]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginReason(null);
    setStep("phone");
    setOtp("");
    setPhone("");
    setFullName("");
    setEmail("");
    setAddressLine1("");
    setAddressLine2("");
    setError(null);
  };

  const handleVerify = async () => {
    if (otp.length < 4) return;

    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await login(phone, otp);
      if (!loggedInUser?.fullName || !loggedInUser?.email) {
        setStep("details");
      } else {
        closeLoginModal();
        window.location.reload();
      }
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Please enter a valid OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
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

      if (!res.ok) throw new Error("Failed to update profile");

      // Update local user state
      // Note: Ideally we should update context, but for now we proceed to next step
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
    if (!user) return;

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

      closeLoginModal();
      window.location.reload();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-[1260px] h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center relative h-16 w-[120px] md:w-auto">
              <img src={logoImg} alt="City Cares" className="absolute top-1/2 -translate-y-1/2 h-[100px] md:h-[200px] w-auto object-contain object-left -ml-[35px] md:-ml-[89px] hover:opacity-80 transition-opacity max-w-none" />
            </Link>
          </div>

          {/* Location & Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-[700px] mx-8 h-12">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white border border-border border-r-0 rounded-l-lg px-4 hover:border-r hover:bg-zinc-50 transition-colors cursor-pointer w-[280px]">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">{userAddress}</span>
            </div>

            <div
              className="flex-1 flex items-center bg-white border border-border rounded-r-lg px-4 cursor-text hover:bg-zinc-50 transition-colors"
              onClick={() => setShowSearch(true)}
            >
              <Search className="h-4 w-4 text-muted-foreground mr-3" />
              <input
                readOnly
                placeholder="Search for services here ..."
                className="flex-1 bg-transparent border-none outline-none text-sm cursor-pointer placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <Button
              variant="outline"
              size="icon"
              className="relative rounded-full h-10 w-10 border-border"
              onClick={() => setIsOpen(true)}
            >
              <motion.div
                animate={itemCount > 0 ? { rotate: [0, -10, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                <ShoppingCart className="h-4 w-4" />
              </motion.div>
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-2 -right-2 h-[18px] w-[18px] bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10 border-border hover:bg-secondary transition-all"
                >
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                {user ? (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.phoneNo}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowProfileDrawer(true)} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBookingsDrawer(true)} className="cursor-pointer">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>My Bookings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowWalletDrawer(true)} className="cursor-pointer">
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>My Wallet</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                      <X className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => setShowLoginModal(true)} className="cursor-pointer font-medium py-3 text-primary">
                    <User className="mr-2 h-4 w-4" />
                    <span>Login</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>



            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden hover:bg-secondary">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-3 bg-secondary/50 rounded-lg">
                    <MapPin className="h-4 w-4" />
                    <span>Bhubaneswar, Odisha</span>
                  </div>
                  {user ? (
                    <>
                      <Button onClick={() => setShowBookingsDrawer(true)} variant="outline" className="w-full justify-start">
                        <Calendar className="mr-2 h-4 w-4" /> My Bookings
                      </Button>
                      <Button onClick={() => setShowWalletDrawer(true)} variant="outline" className="w-full justify-start">
                        <Wallet className="mr-2 h-4 w-4" /> My Wallet
                      </Button>
                      <Button onClick={logout} variant="outline" className="w-full justify-start">
                        <User className="mr-2 h-4 w-4" /> Logout ({user.fullName})
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setShowLoginModal(true)} className="w-full">Login / Sign up</Button>
                  )}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4 px-2">Categories</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {["AC Repair", "Cleaning", "Plumber", "Electrician", "Salon", "Appliances"].map(cat => (
                        <Link key={cat} href={`/category/${cat.toLowerCase().replace(' ', '-')}`}>
                          <Button variant="ghost" size="sm" className="w-full justify-start">{cat}</Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-2xl mx-auto mt-20 p-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                <div className="flex items-center border-b p-4 gap-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <input
                    autoFocus
                    placeholder="Search for services..."
                    className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => setShowSearch(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[60vh]">
                  {searchQuery ? (
                    <div className="space-y-1">
                      {searchResults.length > 0 ? (
                        searchResults.map((result) => (
                          <div
                            key={`${result.type}-${result.id}`}
                            className="flex items-center justify-between p-3 hover:bg-secondary/50 rounded-xl cursor-pointer group transition-all"
                            onClick={() => {
                              if (result.type === 'category') {
                                navigate(`/category/${result.slug}`);
                              } else {
                                navigate(`/service/${result.id}`);
                              }
                              setShowSearch(false);
                              setSearchQuery("");
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                {result.type === 'category' ? <Menu className="h-4 w-4 text-primary" /> : <TrendingUp className="h-4 w-4 text-primary" />}
                              </div>
                              <div>
                                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{result.name}</p>
                                {result.parentName && (
                                  <p className="text-xs text-muted-foreground">in {result.parentName}</p>
                                )}
                              </div>
                            </div>
                            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center">
                          <p className="text-muted-foreground">No services found for "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={(open) => {
        if (!open) closeLoginModal();
        else setShowLoginModal(true);
      }}>
        <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {step === "phone" ? "Login / Sign up" :
                step === "otp" ? "Enter Verification Code" :
                  step === "details" ? "Complete Profile" : "Add Address"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {step === "phone" ? (
              <>
                <div className="text-center mb-6">
                  <p className="text-gray-600 text-sm">
                    {loginReason || "Welcome! Let's get started with your phone number."}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="7008812345"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="pl-12 h-11 bg-gray-50/50"
                        required
                      />
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                  <Button type="submit" className="w-full h-11 bg-[#004e92] hover:bg-[#003d73]" disabled={isLoading || phone.length < 10}>
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify Phone Number"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By proceeding you agree to our Terms and Privacy Policy
                  </p>
                </form>
              </>
            ) : step === "otp" ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    We've sent a verification code to <br />
                    <span className="font-semibold text-foreground">+91 {phone}</span>
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setStep("phone")} className="mt-2 text-xs text-blue-600 hover:text-blue-700">
                    Change Number
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-6">
                  <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="h-12 w-12 text-lg font-bold rounded-lg border-2" />
                      <InputOTPSlot index={1} className="h-12 w-12 text-lg font-bold rounded-lg border-2" />
                      <InputOTPSlot index={2} className="h-12 w-12 text-lg font-bold rounded-lg border-2" />
                      <InputOTPSlot index={3} className="h-12 w-12 text-lg font-bold rounded-lg border-2" />
                    </InputOTPGroup>
                  </InputOTP>

                  <div className="w-full space-y-4">
                    {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                    <Button
                      onClick={handleVerify}
                      className="w-full h-12 bg-[#004e92] hover:bg-[#003d73] text-white font-bold rounded-xl shadow-lg transition-all"
                      disabled={isLoading || otp.length < 4}
                    >
                      {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Verify & Login"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : step === "details" ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={phone} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="enter your valid email"
                    className="h-10 bg-white text-sm"
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
                <Button type="submit" className="w-full h-12 bg-[#004e92] hover:bg-[#003d73] text-white font-bold rounded-xl shadow-lg transition-all" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Complete & Continue"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAddAddress} className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 mb-2"
                  onClick={handleUseCurrentLocation}
                  disabled={isLoading}
                >
                  <Crosshair className="h-4 w-4" />
                  Use Current Location
                </Button>
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    value={addressLine1}
                    onChange={e => setAddressLine1(e.target.value)}
                    placeholder="House No, Building, Street"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    value={addressLine2}
                    onChange={e => setAddressLine2(e.target.value)}
                    placeholder="Area, Landmark"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      value={latitude}
                      onChange={e => setLatitude(e.target.value)}
                      placeholder="20.2961"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      value={longitude}
                      onChange={e => setLongitude(e.target.value)}
                      placeholder="85.8245"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save & Continue"}
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>



      <ProfileDrawer />
      <BookingsDrawer open={showBookingsDrawer} onOpenChange={setShowBookingsDrawer} />
      <WalletDrawer />
    </>
  );
}
