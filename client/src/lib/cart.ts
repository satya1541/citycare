import { API_BASE_URL, getConfig } from "./services";

export interface CartItemAPI {
    id: number;
    userId: number;
    menuId: number;
    quantity: number;
    menu?: {
        id: number;
        title: string;
        basePriceInPaisa: number;
        imagePath: string;
    };
}

export interface CartSummary {
    totalItems: number;
    totalPrice: number;
}

export const getCart = async (userId: number): Promise<CartItemAPI[]> => {
    try {
        const res = await fetch(`${API_BASE_URL}/cart/${userId}`, getConfig());
        const data = await res.json();

        if (Array.isArray(data)) {
            return data;
        }

        return data.success ? data.data : [];
    } catch (error) {
        console.error("Error fetching cart:", error);
        return [];
    }
};

export const addToCart = async (userId: number, serviceId: number, serviceMenuId: number, quantity: number = 1) => {
    try {
        const res = await fetch(`${API_BASE_URL}/cart/${userId}`, {
            ...getConfig(),
            method: "POST",
            body: JSON.stringify({ serviceId, serviceMenuId, quantity }),
        });
        return await res.json();
    } catch (error) {
        console.error("Error adding to cart:", error);
        throw error;
    }
};

export const updateCartItem = async (userId: number, itemId: number, quantity: number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/cart/${userId}/items/${itemId}`, {
            ...getConfig(),
            method: "PUT",
            body: JSON.stringify({ quantity }),
        });
        return await res.json();
    } catch (error) {
        console.error("Error updating cart item:", error);
        throw error;
    }
};

export const removeCartItem = async (userId: number, itemId: number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/cart/${userId}/items/${itemId}`, {
            ...getConfig(),
            method: "DELETE",
        });
        return await res.json();
    } catch (error) {
        console.error("Error removing cart item:", error);
        throw error;
    }
};

export const clearCart = async (userId: number) => {
    try {
        const res = await fetch(`${API_BASE_URL}/cart/${userId}`, {
            ...getConfig(),
            method: "DELETE",
        });
        return await res.json();
    } catch (error) {
        console.error("Error clearing cart:", error);
        throw error;
    }
};
