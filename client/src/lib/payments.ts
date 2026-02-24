import { API_BASE_URL, getConfig } from "./services";

export interface PaymentRequest {
    amount: number; // Amount in paisa
    orderId: string; // Internal order ID (booking ID)
    customerId: string;
}

export interface PaymentVerification {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
}

export const createPayment = async (data: PaymentRequest) => {
    try {
        const res = await fetch(`${API_BASE_URL}/payments/create`, {
            ...getConfig(),
            method: "POST",
            body: JSON.stringify(data),
        });
        return await res.json();
    } catch (error) {
        console.error("Error creating payment:", error);
        throw error;
    }
};

export const verifyPayment = async (data: PaymentVerification) => {
    try {
        const res = await fetch(`${API_BASE_URL}/payments/verify`, {
            ...getConfig(),
            method: "POST",
            body: JSON.stringify(data),
        });
        return await res.json();
    } catch (error) {
        console.error("Error verifying payment:", error);
        throw error;
    }
};
