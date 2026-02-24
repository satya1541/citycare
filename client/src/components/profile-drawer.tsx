import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Phone, LogOut, MapPin, Edit2, Trash2, AlertTriangle, Crosshair, Plus, BadgeCheck, Loader2, ArrowLeft, Camera, Gift, Copy, Check, Star } from "lucide-react";
import { sendEmailOtp, validateEmailOtp, updateCustomerProfile, uploadCustomerProfilePicture, getImageUrl, getReferralCode, applyReferralCode, setDefaultAddress, getCustomerRatings } from "@/lib/services";
import { useToast } from "@/hooks/use-toast";


export function ProfileDrawer() {
    const { user, logout, showProfileDrawer, setShowProfileDrawer } = useAuth();
    const { toast } = useToast();



    interface Address {
        id: number;
        userId: number;
        fullName?: string;
        phoneNo?: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        pincode: string;
        label: string;
        latitude: number;
        longitude: number;
        isDefault?: boolean;
    }

    interface UserDetails {
        id: number;
        fullName: string;
        email: string;
        phoneNo: string;
        userName?: string;
        role?: string;
        isEmailValid: boolean;
        referredByCode?: string;
        points: number;
        profile: {
            profileImageUrl: string | null;
            bio: string | null;
        };
    }

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({
        fullName: "",
        phoneNo: "",
        addressLine1: "",
        addressLine2: "",
        label: "Home",
        latitude: "" as string | number,
        longitude: "" as string | number
    });

    // Email Verification State
    const [showEmailOtpDialog, setShowEmailOtpDialog] = useState(false);
    const [emailOtp, setEmailOtp] = useState("");
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
    const [addressFormError, setAddressFormError] = useState<string | null>(null);

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editProfileData, setEditProfileData] = useState({ fullName: "", email: "" });
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [imageTimestamp, setImageTimestamp] = useState(Date.now());

    // Referral State
    const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
    const [isFetchingReferral, setIsFetchingReferral] = useState(false);
    const [referralCodeInput, setReferralCodeInput] = useState("");
    const [isApplyingReferral, setIsApplyingReferral] = useState(false);
    const [copied, setCopied] = useState(false);

    // Ratings State
    const [myRatings, setMyRatings] = useState<any[]>([]);
    const [isFetchingRatings, setIsFetchingRatings] = useState(false);

    useEffect(() => {
        if (user) {
            setNewAddress(prev => ({
                ...prev,
                fullName: user.fullName || "",
                phoneNo: user.phoneNo || ""
            }));
        }
    }, [user, isAddingAddress]);

    useEffect(() => {
        if (user?.id && showProfileDrawer) {
            fetchAddresses();
            fetchUserDetails();
            fetchMyReferralCode();
            fetchMyRatings();
        }
    }, [user?.id, showProfileDrawer]);

    const fetchMyRatings = async () => {
        if (!user) return;
        setIsFetchingRatings(true);
        try {
            const res = await getCustomerRatings(user.id);
            if (res.success) {
                setMyRatings(res.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch ratings", error);
        } finally {
            setIsFetchingRatings(false);
        }
    };

    const handleUseCurrentLocationForAdd = () => {
        if (!navigator.geolocation) {
            setAddressFormError("Geolocation is not supported by your browser");
            return;
        }

        setIsSaving(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Call Google Maps API
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

                            setNewAddress(prev => ({
                                ...prev,
                                addressLine1: `${streetNumber} ${route}`.trim(),
                                addressLine2: sublocality,
                                latitude: latitude.toFixed(8),
                                longitude: longitude.toFixed(8)
                            }));
                        }
                    })
                    .catch((error) => console.error("Error fetching address:", error))
                    .finally(() => setIsSaving(false));
            },
            (error) => {
                console.error("Error getting location:", error);
                setIsSaving(false);
            }
        );
    };

    const handleAddNewAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
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
                    fullName: newAddress.fullName,
                    phoneNo: newAddress.phoneNo,
                    addressLine1: newAddress.addressLine1,
                    addressLine2: newAddress.addressLine2,
                    label: newAddress.label,
                    latitude: Number(Number(newAddress.latitude).toFixed(8)),
                    longitude: Number(Number(newAddress.longitude).toFixed(8))
                }),
            });

            if (!res.ok) throw new Error("Failed to add address");

            setIsAddingAddress(false);
            fetchAddresses();
            // Reset form
            setNewAddress({
                fullName: user.fullName || "",
                phoneNo: user.phoneNo || "",
                addressLine1: "",
                addressLine2: "",
                label: "Home",
                latitude: "",
                longitude: ""
            });
        } catch (error) {
            console.error("Failed to add address", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendEmailOtp = async () => {
        if (!user?.email) return;
        setIsSendingOtp(true);
        setEmailError(null);
        try {
            const res = await sendEmailOtp(user.id, user.email);
            if (res.success) {
                setShowEmailOtpDialog(true);
            } else {
                setEmailError(res.message || "Something went wrong. Please retry.");
            }
        } catch (error: any) {
            setEmailError(error.message || "Failed to send OTP. Please retry.");
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyEmailOtp = async () => {
        if (!user) return;
        setIsVerifyingOtp(true);
        setEmailError(null);
        try {
            const res = await validateEmailOtp(user.id, emailOtp);
            if (res.success) {
                setEmailSuccess("Email verified successfully!");
                setTimeout(() => {
                    setShowEmailOtpDialog(false);
                    setEmailSuccess(null);
                }, 1500);
                fetchUserDetails(); // Refresh user details to get updated verified status
            } else {
                setEmailError(res.message || "Invalid OTP");
            }
        } catch (error: any) {
            setEmailError(error.message || "Failed to verify OTP.");
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    useEffect(() => {
        if (user?.id && showProfileDrawer) {
            fetchAddresses();
            fetchUserDetails();
            fetchMyReferralCode();
        }
    }, [user?.id, showProfileDrawer]);

    const fetchMyReferralCode = async () => {
        setIsFetchingReferral(true);
        try {
            const res = await getReferralCode();
            if (res.success && res.data?.code) {
                setMyReferralCode(res.data.code);
            }
        } catch (error) {
            console.error("Failed to fetch referral code", error);
        } finally {
            setIsFetchingReferral(false);
        }
    };

    const fetchUserDetails = async () => {
        if (!user) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`https://citycare.thynxai.cloud/api/users/${user.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.data?.user) {
                setUserDetails({
                    ...data.data.user,
                    profile: data.data.profile
                });
            }
        } catch (error) {
            console.error("Failed to fetch user details", error);
        }
    };

    const handleOpenEditProfile = () => {
        setEditProfileData({
            fullName: userDetails?.fullName || user?.fullName || "",
            email: userDetails?.email || user?.email || ""
        });
        setShowEditProfile(true);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsUpdatingProfile(true);
        try {
            const res = await updateCustomerProfile(user.id, {
                fullName: editProfileData.fullName,
                email: editProfileData.email
            });
            if (res.success) {
                setShowEditProfile(false);
                fetchUserDetails(); // Refresh UI with new details
            }
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingPhoto(true);
        try {
            const res = await uploadCustomerProfilePicture(user.id, file);
            if (res.success) {
                setImageTimestamp(Date.now());
                fetchUserDetails(); // Refresh to get the new image URL
            }
        } catch (error) {
            console.error("Failed to upload profile picture", error);
        } finally {
            setIsUploadingPhoto(false);
            // Reset the file input so the same file could be selected again if needed
            e.target.value = '';
        }
    };

    const fetchAddresses = async () => {
        if (!user) return;
        setIsLoadingAddresses(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`https://citycare.thynxai.cloud/api/addresses/${user.id}?page=1&limit=10&status=true`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAddresses(data.data.records || []);
            } else {
                setAddresses(Array.isArray(data.data) ? data.data : []);
            }
        } catch (error) {
            console.error("Failed to fetch addresses", error);
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`https://citycare.thynxai.cloud/api/addresses/${deleteId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setAddresses(prev => prev.filter(addr => addr.id !== deleteId));
            }
        } catch (error) {
            console.error("Failed to delete address", error);
        } finally {
            setDeleteId(null);
        }
    };

    const handleUpdateAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAddress) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`https://citycare.thynxai.cloud/api/addresses/${editingAddress.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    fullName: editingAddress.fullName,
                    phoneNo: editingAddress.phoneNo,
                    addressLine1: editingAddress.addressLine1,
                    addressLine2: editingAddress.addressLine2,
                    label: editingAddress.label,
                    latitude: Number(Number(editingAddress.latitude).toFixed(8)),
                    longitude: Number(Number(editingAddress.longitude).toFixed(8))
                })
            });

            if (res.ok) {
                setEditingAddress(null);
                fetchAddresses();
            }
        } catch (error) {
            console.error("Failed to update address", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetDefaultAddress = async (addressId: number) => {
        if (!user) return;
        try {
            const res = await setDefaultAddress(user.id, addressId);
            if (res.success) {
                toast({ title: "Success", description: "Default address updated." });
                fetchAddresses();
            } else {
                toast({ title: "Error", description: res.message || "Could not set default address.", variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to set default address.", variant: "destructive" });
        }
    };

    const handleLogout = () => {
        logout();
        setShowProfileDrawer(false);
    };

    const handleCopyReferral = () => {
        if (!myReferralCode) return;
        navigator.clipboard.writeText(myReferralCode);
        setCopied(true);
        toast({ title: "Copied!", description: "Referral code copied to clipboard." });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApplyReferral = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!referralCodeInput.trim()) return;

        setIsApplyingReferral(true);
        try {
            const res = await applyReferralCode(referralCodeInput.trim());
            if (res.success) {
                toast({ title: "Success!", description: "Referral code applied successfully." });
                setReferralCodeInput("");
                fetchUserDetails(); // Refresh to show updated referredBy status if the API provides it
            } else {
                toast({ title: "Failed to apply code", description: res.message, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Something went wrong.", variant: "destructive" });
        } finally {
            setIsApplyingReferral(false);
        }
    };

    return (
        <Sheet open={showProfileDrawer} onOpenChange={setShowProfileDrawer}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-sm shadow-2xl">
                <SheetHeader className="px-4 py-4 border-b bg-background/50 backdrop-blur sticky top-0 z-10 text-left flex flex-row items-center gap-3 space-y-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden -ml-2 shrink-0" onClick={() => setShowProfileDrawer(false)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <SheetTitle className="text-xl flex items-center gap-2 m-0">
                        <User className="h-5 w-5 text-primary hidden sm:block" />
                        My Profile
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                        View and edit your profile details, manage addresses, and see your ratings.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6 py-6 overflow-y-auto">
                    <div className="space-y-8 pb-10">
                        {/* User Info Card */}
                        <div className="bg-white rounded-xl shadow-sm border p-5 relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                            <div className="flex items-center gap-4 mb-6 relative">
                                <div className="relative group/avatar cursor-pointer shrink-0">
                                    <input
                                        type="file"
                                        id="profile-upload"
                                        className="hidden"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoUpload}
                                        disabled={isUploadingPhoto}
                                    />
                                    <label htmlFor="profile-upload" className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-background shadow-sm overflow-hidden cursor-pointer relative block">
                                        {isUploadingPhoto ? (
                                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                        ) : userDetails?.profile?.profileImageUrl || user?.profile?.profileImageUrl ? (
                                            <img
                                                src={`${getImageUrl(userDetails?.profile?.profileImageUrl || user?.profile?.profileImageUrl)}?t=${imageTimestamp}`}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-8 h-8 text-primary" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                    </label>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">{userDetails?.fullName || user?.fullName || "User"}</h2>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-muted-foreground">{userDetails?.email || user?.email || "No email provided"}</p>
                                        {(userDetails?.email || user?.email) && (
                                            (userDetails?.isEmailValid || user?.isEmailValid) ? (
                                                <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-50" aria-label="Verified" />
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    className="h-5 px-1.5 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                    onClick={(e) => { e.stopPropagation(); handleSendEmailOtp(); }}
                                                    disabled={isSendingOtp}
                                                >
                                                    {isSendingOtp ? "..." : "Verify"}
                                                </Button>
                                            )
                                        )}
                                    </div>
                                    {userDetails?.role && (
                                        <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                                            {userDetails.role}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-4 gap-2 text-primary border-primary/20 hover:bg-primary/5"
                                onClick={handleOpenEditProfile}
                            >
                                <Edit2 className="w-4 h-4" />
                                Edit Profile
                            </Button>

                            <div className="space-y-3 relative mt-6">
                                <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg hover:bg-gray-100/80 transition-colors">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone Number</p>
                                        <p className="font-medium text-sm text-foreground">{userDetails?.phoneNo || user?.phoneNo}</p>
                                    </div>
                                </div>
                                {userDetails?.userName && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg hover:bg-gray-100/80 transition-colors">
                                        <User className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Username</p>
                                            <p className="font-medium text-sm text-foreground">{userDetails.userName}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Saved Addresses */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                                <div className="flex items-center gap-2 text-foreground">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <h3 className="font-semibold">Saved Addresses</h3>
                                </div>
                                <span className="text-xs text-muted-foreground">{addresses.length} saved</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                                onClick={() => setIsAddingAddress(true)}
                            >
                                <Plus className="w-4 h-4" />
                                Add New Address
                            </Button>

                            <div className="space-y-3">
                                {isLoadingAddresses ? (
                                    <div className="py-8 text-center">
                                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">Loading addresses...</p>
                                    </div>
                                ) : addresses.length === 0 ? (
                                    <div className="py-8 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                                        <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">No saved addresses found.</p>
                                    </div>
                                ) : (
                                    addresses.map(addr => (
                                        <div key={addr.id} className="bg-white border rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all group relative">
                                            <div className="space-y-1 mb-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wide">{addr.label}</span>
                                                    {addr.isDefault && (
                                                        <span className="font-bold text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full uppercase tracking-wide flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="font-medium text-sm text-foreground">{addr.fullName}</p>
                                                <p className="text-xs text-muted-foreground">{addr.phoneNo}</p>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed pr-8">
                                                {addr.addressLine1}
                                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                                            </p>

                                            <div className="absolute top-4 right-4 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600" onClick={() => setEditingAddress(addr)}>
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleteId(addr.id)}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                            {!addr.isDefault && (
                                                <div className="mt-3 flex justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:bg-primary/10" onClick={() => handleSetDefaultAddress(addr.id)}>
                                                        Set as Default
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Refer and Earn Section */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-2 text-foreground border-b pb-2">
                                <Gift className="w-5 h-5 text-indigo-600" />
                                <h3 className="font-semibold">Refer & Earn</h3>
                            </div>

                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                                <p className="text-sm font-medium text-indigo-900 mb-1">Your Referral Code</p>
                                <p className="text-xs text-indigo-700/80 mb-3">Share this code with friends to earn exciting rewards.</p>

                                {isFetchingReferral ? (
                                    <div className="h-11 w-full flex items-center justify-center bg-white rounded-lg border border-indigo-100 border-dashed">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                    </div>
                                ) : myReferralCode ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-2.5 font-mono font-bold tracking-widest text-indigo-950 text-center">
                                            {myReferralCode}
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-11 w-11 shrink-0 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                                            onClick={handleCopyReferral}
                                        >
                                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-sm text-center text-indigo-500 bg-white border border-indigo-100 border-dashed rounded-lg py-3">
                                        No referral code available yet.
                                    </div>
                                )}
                            </div>

                            {!userDetails?.referredByCode && (
                                <div className="bg-white border rounded-xl p-4 shadow-sm">
                                    <p className="text-sm font-medium text-foreground mb-1">Have a Referral Code?</p>
                                    <p className="text-xs text-muted-foreground mb-3">Enter it below to claim your reward.</p>
                                    <form onSubmit={handleApplyReferral} className="flex gap-2">
                                        <Input
                                            placeholder="Enter code"
                                            className="h-10 text-sm font-mono uppercase"
                                            value={referralCodeInput}
                                            onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                                        />
                                        <Button
                                            type="submit"
                                            className="h-10 px-6 whitespace-nowrap"
                                            disabled={!referralCodeInput.trim() || isApplyingReferral}
                                        >
                                            {isApplyingReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                        </Button>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* My Ratings Section */}
                        <div className="space-y-4 pt-2 border-t">
                            <div className="flex items-center gap-2 text-foreground pb-2">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <h3 className="font-semibold">My Ratings & Reviews</h3>
                            </div>

                            <div className="space-y-3">
                                {isFetchingRatings ? (
                                    <div className="py-8 text-center">
                                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                        <p className="text-xs text-muted-foreground">Loading ratings...</p>
                                    </div>
                                ) : myRatings.length === 0 ? (
                                    <div className="py-8 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                                        <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">You haven't rated any services yet.</p>
                                    </div>
                                ) : (
                                    myRatings.map((rating: any) => (
                                        <div key={rating.id} className="bg-white border rounded-xl p-4 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-sm text-gray-900">{rating.serviceName || "Service"}</h4>
                                                    <p className="text-xs text-gray-500">{new Date(rating.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex bg-yellow-50 px-2 py-1 rounded-full items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                                                    <span className="text-xs font-bold text-yellow-700">{rating.rating}</span>
                                                </div>
                                            </div>
                                            {rating.review && (
                                                <p className="text-sm text-gray-600 mt-2 italic">"{rating.review}"</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button
                                variant="destructive"
                                className="w-full gap-2 h-11 shadow-lg shadow-red-100 hover:shadow-red-200 transition-all"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </ScrollArea>

                {/* Edit Address Dialog */}
                <Dialog open={!!editingAddress} onOpenChange={(open) => !open && setEditingAddress(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Address</DialogTitle>
                        </DialogHeader>
                        {editingAddress && (
                            <form onSubmit={handleUpdateAddress} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={editingAddress.fullName}
                                        onChange={e => setEditingAddress({ ...editingAddress, fullName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={editingAddress.phoneNo}
                                        onChange={e => setEditingAddress({ ...editingAddress, phoneNo: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address Line 1</Label>
                                    <Input
                                        value={editingAddress.addressLine1}
                                        onChange={e => setEditingAddress({ ...editingAddress, addressLine1: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Address Line 2</Label>
                                    <Input
                                        value={editingAddress.addressLine2}
                                        onChange={e => setEditingAddress({ ...editingAddress, addressLine2: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Latitude</Label>
                                        <Input
                                            value={editingAddress.latitude}
                                            onChange={e => setEditingAddress({ ...editingAddress, latitude: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Longitude</Label>
                                        <Input
                                            value={editingAddress.longitude}
                                            onChange={e => setEditingAddress({ ...editingAddress, longitude: Number(e.target.value) })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Label (e.g. Home, Office)</Label>
                                    <Input
                                        value={editingAddress.label}
                                        onChange={e => setEditingAddress({ ...editingAddress, label: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Update Address"}
                                </Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                </div>
                                <DialogTitle>Delete Address</DialogTitle>
                            </div>
                            <DialogDescription className="pt-2">
                                Are you sure you want to delete this address? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4 gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                            <Button variant="destructive" onClick={confirmDelete}>Delete Address</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* Add Address Dialog */}
                <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Address</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddNewAddress} className="space-y-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full gap-2 mb-2 text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100"
                                onClick={handleUseCurrentLocationForAdd}
                                disabled={isSaving}
                            >
                                <Crosshair className="h-4 w-4" />
                                Use Current Location
                            </Button>

                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={newAddress.fullName}
                                    onChange={e => setNewAddress({ ...newAddress, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                    value={newAddress.phoneNo}
                                    onChange={e => setNewAddress({ ...newAddress, phoneNo: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address Line 1</Label>
                                <Input
                                    value={newAddress.addressLine1}
                                    onChange={e => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                                    placeholder="House No, Building, Street"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address Line 2</Label>
                                <Input
                                    value={newAddress.addressLine2}
                                    onChange={e => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
                                    placeholder="Area, Landmark"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Latitude</Label>
                                    <Input
                                        value={newAddress.latitude}
                                        onChange={e => setNewAddress({ ...newAddress, latitude: e.target.value })}
                                        placeholder="20.2961"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Longitude</Label>
                                    <Input
                                        value={newAddress.longitude}
                                        onChange={e => setNewAddress({ ...newAddress, longitude: e.target.value })}
                                        placeholder="85.8245"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Label (e.g. Home, Office)</Label>
                                <Input
                                    value={newAddress.label}
                                    onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save Address"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Email OTP Dialog */}
                <Dialog open={showEmailOtpDialog} onOpenChange={setShowEmailOtpDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Verify Email</DialogTitle>
                            <DialogDescription>
                                Enter the OTP sent to {user?.email}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>OTP Code</Label>
                                <Input
                                    value={emailOtp}
                                    onChange={(e) => setEmailOtp(e.target.value)}
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                />
                            </div>
                            {emailError && <p className="text-red-500 text-xs text-center font-medium">{emailError}</p>}
                            {emailSuccess && <p className="text-green-600 text-xs text-center font-medium">{emailSuccess}</p>}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowEmailOtpDialog(false)}>Cancel</Button>
                            <Button onClick={handleVerifyEmailOtp} disabled={isVerifyingOtp}>
                                {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Verify Email
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Profile Dialog */}
                <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                            <DialogDescription>
                                Update your personal information.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleUpdateProfile} className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={editProfileData.fullName}
                                    onChange={(e) => setEditProfileData({ ...editProfileData, fullName: e.target.value })}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input
                                    type="email"
                                    value={editProfileData.email}
                                    onChange={(e) => setEditProfileData({ ...editProfileData, email: e.target.value })}
                                    placeholder="your.email@example.com"
                                />
                                <p className="text-xs text-muted-foreground">You may need to verify a new email address.</p>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowEditProfile(false)}>Cancel</Button>
                                <Button type="submit" disabled={isUpdatingProfile}>
                                    {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SheetContent>
        </Sheet>
    );
}
