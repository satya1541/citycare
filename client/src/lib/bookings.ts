import { API_BASE_URL, getConfig } from "./services";

export interface TimeSlot {
    start: string; // ISO string or time string
    end: string;
    available: boolean;
}

export interface Booking {
    id: number;
    status: string;
    bookingDate: string;
    timeSlot: string;
    paymentStatus?: string;
    paymentMode?: string;
    finalAmountInPaisa: string | number;
    vendor?: {
        name: string;
        phoneNo: string;
    };
    address: {
        addressLine1: string;
        addressLine2: string;
        city?: string;
        label?: string;
    };
    serviceMenus: {
        id: number;
        title: string;
        quantity: number;
        basePriceInPaisa: string | number;
    }[];
}

export const checkAvailability = async (date: string, latitude: number, longitude: number) => {
    const res = await fetch(`${API_BASE_URL}/bookings/check-availability?date=${date}&lat=${latitude}&lng=${longitude}`, getConfig());
    return await res.json();
};

export const getAvailableSlots = async (serviceId: number, serviceMenuId: number, bookingDate: string, latitude: number, longitude: number) => {
    const res = await fetch(`${API_BASE_URL}/bookings/available-slots?serviceId=${serviceId}&serviceMenuId=${serviceMenuId}&bookingDate=${bookingDate}&latitude=${latitude}&longitude=${longitude}`, getConfig());
    return await res.json();
};

export const scheduleCart = async (userId: number, serviceId: number, bookingDate: string, timeSlot: string, addressId: number) => {
    const res = await fetch(`${API_BASE_URL}/cart/schedule`, {
        ...getConfig(),
        method: "PUT",
        body: JSON.stringify({ userId, serviceId, bookingDate, timeSlot, addressId }),
    });
    return await res.json();
};

export const createBookingFromCart = async (userId: number, bookingData: {
    serviceId: number;
    paymentMethod: string;
}) => {
    const res = await fetch(`${API_BASE_URL}/bookings/from-cart`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify({
            userId,
            serviceId: bookingData.serviceId,
            paymentMethod: bookingData.paymentMethod
        }),
    });
    return await res.json();
};

export const getUserBookings = async (userId: number) => {
    const res = await fetch(`${API_BASE_URL}/bookings?userId=${userId}`, getConfig());
    return await res.json();
};

export const getBookingDetails = async (bookingId: number) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, getConfig());
    return await res.json();
};

export const rateBooking = async (
    bookingId: number,
    customerId: number,
    ratingData: { rating: number; reviewText: string; serviceQuality?: number; punctuality?: number; valueForMoney?: number }
) => {
    const res = await fetch(`${API_BASE_URL}/ratings/booking/${bookingId}/customer/${customerId}`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify(ratingData),
    });
    return await res.json();
};

export const cancelBooking = async (bookingId: number, customerId: number, reason: string) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/cancel/${customerId}`, {
        ...getConfig(),
        method: "POST",
        body: JSON.stringify({ reason }),
    });
    return await res.json();
};

export const rescheduleBooking = async (
    bookingId: number,
    customerId: number,
    bookingDate: string,
    timeSlot: string
) => {
    const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reschedule/${customerId}`, {
        ...getConfig(),
        method: "PUT",
        body: JSON.stringify({ bookingDate, timeSlot }),
    });
    return await res.json();
};

export const getBookingRatings = async (bookingId: number) => {
    const res = await fetch(`${API_BASE_URL}/ratings/booking/${bookingId}`, getConfig());
    return await res.json();
};
