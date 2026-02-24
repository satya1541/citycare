
export const API_BASE_URL = "https://citycare.thynxai.cloud/api";
export const S3_BASE_URL = "https://citycaretest.s3.ap-south-2.amazonaws.com/";

export interface Service {
    id: number;
    name: string;
    description: string;
    imagePath: string;
    parentId: number | null;
}

export interface ServiceMenu {
    id: number;
    title: string;
    description: string;
    basePriceInPaisa: number;
    imagePath: string;
    serviceId: number;
}

export interface ServiceGroupedBySubcategory {
    subcategoryId: number;
    subcategoryTitle: string;
    subcategoryDescription: string;
    subcategoryImagePath: string;
    items: ServiceMenu[];
}

export const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    };
};

export const getParentServices = async (): Promise<Service[]> => {
    const res = await fetch(`${API_BASE_URL}/services/parents`, getConfig());
    const data = await res.json();
    return data.success ? data.data : [];
};

export const getServicesByParent = async (parentId: number): Promise<Service[]> => {
    const res = await fetch(`${API_BASE_URL}/services/by-parent/${parentId}`, getConfig());
    const data = await res.json();
    return data.success ? data.data : [];
};

export const getServiceMenusGrouped = async (serviceId: number): Promise<ServiceGroupedBySubcategory[]> => {
    const res = await fetch(`${API_BASE_URL}/service-menus/grouped-by-subcategory?serviceId=${serviceId}`, getConfig());
    const data = await res.json();
    return data.success ? data.data : [];
};

export const getServiceById = async (id: number): Promise<Service | null> => {
    const res = await fetch(`${API_BASE_URL}/services/${id}`, getConfig());
    const data = await res.json();
    return data.success ? data.data : null;
};

export const getImageUrl = (path: string | null | undefined) => {
    if (!path) return "/placeholder.jpg"; // You might want a better placeholder
    if (path.startsWith("http")) return path;
    return `${S3_BASE_URL}${path}`;
};
export interface Address {
    id: number;
    userId: number;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    type: "home" | "work" | "other";
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
}

export const getUserAddresses = async (userId: number): Promise<Address[]> => {
    try {
        const res = await fetch(`${API_BASE_URL}/addresses/${userId}`, getConfig());
        const data = await res.json();

        // Handle raw array response
        if (Array.isArray(data)) {
            return data;
        }

        // Handle success=false explicitly
        if (data.success === false) return [];

        if (Array.isArray(data.data)) {
            return data.data;
        }

        if (data.data && Array.isArray(data.data.records)) {
            return data.data.records;
        }

        return [];
    } catch (error) {
        console.error("Error fetching addresses:", error);
        return [];
    }
};

export const setDefaultAddress = async (userId: number, addressId: number) => {
    const res = await fetch(`${API_BASE_URL}/addresses/${userId}/${addressId}/default`, {
        ...getConfig(),
        method: "PATCH",
    });
    return await res.json();
};

export const getDefaultAddress = async (userId: number) => {
    const res = await fetch(`${API_BASE_URL}/addresses/${userId}/default`, getConfig());
    return await res.json();
};

export const loadRazorpay = () => {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const sendEmailOtp = async (userId: number, email: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/email/send-otp`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify({ email }),
    });
    return await res.json();
};

export const validateEmailOtp = async (userId: number, otp: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/email/validate`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify({ otp }),
    });
    return await res.json();
};

export const updateCustomerProfile = async (
    userId: number,
    data: { fullName?: string; email?: string }
) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/customer`, {
        ...getConfig(),
        method: "PUT",
        body: JSON.stringify(data),
    });
    return await res.json();
};

export const uploadCustomerProfilePicture = async (userId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/users/${userId}/customer/upload`, {
        method: "PUT",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });
    return await res.json();
};

// Wallet APIs
export const getWalletBalance = async (userId: number) => {
    const res = await fetch(`${API_BASE_URL}/wallets/${userId}/balance`, getConfig());
    // Fallback if the user has no wallet created yet
    if (res.status === 404) return { success: true, data: { balanceInPaisa: 0 } };
    const data = await res.json();
    let balanceInPaisa = 0;

    if (data.balanceInPaisa !== undefined) {
        balanceInPaisa = data.balanceInPaisa;
    } else if (data.data?.balanceInPaisa !== undefined) {
        balanceInPaisa = data.data.balanceInPaisa;
    }

    return { success: data.success ?? true, data: { balanceInPaisa } };
};

export const getWalletTransactions = async (userId: number) => {
    const res = await fetch(`${API_BASE_URL}/wallets/${userId}/transactions`, getConfig());
    if (res.status === 404) return { success: true, data: [] };
    const data = await res.json();
    let txData = [];
    if (Array.isArray(data)) {
        txData = data;
    } else if (Array.isArray(data.data)) {
        txData = data.data;
    } else if (data.data && Array.isArray(data.data.records)) {
        txData = data.data.records;
    }
    return { success: data.success ?? true, data: txData };
};

export const createWalletTopup = async (userId: number, amountInPaisa: number) => {
    const res = await fetch(`${API_BASE_URL}/wallets/${userId}/topup/create`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify({ amountInPaisa }),
    });
    return await res.json();
};

export const verifyWalletTopup = async (userId: number, paymentData: any) => {
    const res = await fetch(`${API_BASE_URL}/wallets/${userId}/topup/verify`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify(paymentData),
    });
    return await res.json();
};

// Referral APIs
export const getReferralCode = async () => {
    const res = await fetch(`${API_BASE_URL}/referrals/my-code`, getConfig());
    return await res.json();
};

export const applyReferralCode = async (code: string) => {
    const res = await fetch(`${API_BASE_URL}/referrals/apply`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify({ code }),
    });
    return await res.json();
};

// Direct Payments APIs
export const createPaymentOrder = async (amountInPaisa: number, referenceId: number, receipt: string = "order_rcptid_11") => {
    const res = await fetch(`${API_BASE_URL}/payments/create`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify({ amountInPaisa, receipt, referenceId }),
    });
    return await res.json();
};

export const verifyPayment = async (paymentData: any) => {
    const res = await fetch(`${API_BASE_URL}/payments/verify`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify(paymentData),
    });
    return await res.json();
};

// Ratings API
export const getCustomerRatings = async (customerId: number) => {
    const res = await fetch(`${API_BASE_URL}/ratings/customer/${customerId}`, getConfig());
    return await res.json();
};
