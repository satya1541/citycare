import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./auth-context"; // Import useAuth
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart as apiClearCart } from "./cart";
import { getImageUrl } from "./services";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  description?: string;
  menuId: number; // needed for API
  serviceId?: number; // needed for API
  cartItemId?: number; // DB ID for API updates/deletes
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  error: string | null;
  clearError: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to parse any cart API response format into CartItem[]
function parseCartData(cartData: any): CartItem[] {
  let loadedItems: CartItem[] = [];

  if (Array.isArray(cartData)) {
    // Handle flat array format
    loadedItems = cartData.map(item => {
      const menu = item.menu || { title: "Unknown Item", basePriceInPaisa: 0, imagePath: null };
      return {
        id: item.menuId ? item.menuId.toString() : (item.id ? item.id.toString() : `temp-${Math.random()}`),
        menuId: item.menuId,
        name: menu.title,
        price: (menu.basePriceInPaisa || 0) / 100,
        quantity: item.quantity,
        image: getImageUrl(menu.imagePath),
        description: "",
        serviceId: Number(item.serviceId),
        cartItemId: item.id,
      };
    });
  } else if (cartData?.itemsByService && Array.isArray(cartData.itemsByService)) {
    // Handle nested itemsByService structure
    cartData.itemsByService.forEach((serviceGroup: any) => {
      if (serviceGroup.subcategories && Array.isArray(serviceGroup.subcategories)) {
        serviceGroup.subcategories.forEach((sub: any) => {
          if (sub.item && Array.isArray(sub.item)) {
            sub.item.forEach((item: any) => {
              loadedItems.push({
                id: item.serviceMenuId ? item.serviceMenuId.toString() : item.id.toString(),
                menuId: item.serviceMenuId,
                name: item.serviceMenuTitle || item.serviceMenu?.name || "Unknown",
                price: (item.serviceMenu?.basePriceInPaisa || item.itemTotal / item.quantity || 0) / 100,
                quantity: item.quantity,
                image: getImageUrl(item.serviceMenuImage || item.serviceMenu?.imagePath),
                description: item.serviceMenu?.description || "",
                serviceId: item.serviceId,
                cartItemId: item.id
              });
            });
          }
        });
      }
    });
  } else {
    console.error("Unknown cart data format:", cartData);
  }

  return loadedItems;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Load initial cart from local storage for guest, or fetch from API for user
  useEffect(() => {
    const loadCart = async () => {
      console.log("Loading cart. User:", user ? user.id : "Guest");
      if (user) {
        try {
          const cartData = await getCart(user.id) as any;
          console.log("Cart API Response:", cartData);
          const loadedItems = parseCartData(cartData);
          console.log("Mapped Cart Items:", loadedItems);
          setItems(loadedItems);
        } catch (error) {
          console.error("Failed to load cart from API", error);
        }
      } else {
        // Guest: Load from local storage
        const savedCart = localStorage.getItem("guest_cart");
        console.log("Loading guest cart from local storage:", savedCart);
        if (savedCart) {
          try {
            setItems(JSON.parse(savedCart));
          } catch (e) {
            console.error("Failed to parse guest cart", e);
            setItems([]);
          }
        }
      }
    };
    loadCart();
  }, [user, isAuthenticated]);

  // Save to local storage whenever items change (for guest persistence)
  useEffect(() => {
    if (!user) {
      localStorage.setItem("guest_cart", JSON.stringify(items));
    }
  }, [items, user]);

  // Helper to re-fetch cart from API and update state
  const refreshCartFromApi = async () => {
    if (!user) return;
    try {
      const cartData = await getCart(user.id) as any;
      const loadedItems = parseCartData(cartData);
      setItems(loadedItems);
    } catch (err) {
      console.error("Failed to refresh cart from API", err);
    }
  };

  const addItem = async (newItem: Omit<CartItem, "quantity">) => {
    // Optimistic update
    const tempId = newItem.id;
    setItems((prev) => {
      const existing = prev.find((item) => item.id === tempId);
      if (existing) {
        return prev.map((item) =>
          item.id === tempId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsOpen(true);

    if (user) {
      setError(null);
      try {
        const menuId = newItem.menuId || parseInt(newItem.id);
        const serviceId = newItem.serviceId;

        if (!isNaN(menuId) && serviceId) {
          await addToCart(user.id, serviceId, menuId, 1);
          // Re-fetch to sync with server state (uses same parser as initial load)
          await refreshCartFromApi();
        } else {
          console.error("Missing serviceId or menuId for adding to cart");
        }
      } catch (error: any) {
        console.error("Failed to add item to API cart", error);
        setError("Failed to add item to cart. Please try again.");
        // Revert optimistic update
        setItems(prev => prev.filter(i => i.id !== newItem.id));
      }
    }
  };

  const removeItem = async (id: string) => {
    let targetCartItemId: number | undefined;
    setItems((prev) => {
      const item = prev.find(i => i.id === id);
      if (item) targetCartItemId = item.cartItemId;
      return prev.filter((item) => item.id !== id);
    });

    if (user) {
      setError(null);
      try {
        const apiId = targetCartItemId || parseInt(id);
        await removeCartItem(user.id, apiId);
      } catch (error: any) {
        console.error("Failed to remove item from API cart", error);
        setError("Failed to remove item. Please try again.");
      }
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    let newQuantity = 0;
    let targetCartItemId: number | undefined;

    setItems((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          newQuantity = Math.max(0, item.quantity + delta);
          targetCartItemId = item.cartItemId;
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item) => item.quantity > 0);
    });

    if (user) {
      setError(null);
      try {
        const apiId = targetCartItemId || parseInt(id);
        if (newQuantity === 0) {
          await removeCartItem(user.id, apiId);
        } else {
          await updateCartItem(user.id, apiId, newQuantity);
        }
      } catch (error: any) {
        console.error("Failed to update item quantity in API cart", error);
        setError("Failed to update quantity. Please check your connection.");
        // Revert?
      }
    }
  };

  const clearCart = async () => {
    setItems([]);
    if (user) {
      setError(null);
      try {
        await apiClearCart(user.id);
      } catch (error: any) {
        console.error("Failed to clear API cart", error);
        setError("Failed to clear cart.");
      }
    } else {
      localStorage.removeItem("guest_cart");
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
        isOpen,
        setIsOpen,
        error,
        clearError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
