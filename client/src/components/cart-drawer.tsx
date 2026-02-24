import { useCart } from "@/lib/cart-context";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import emptyCartImg from "@assets/empty_cart_illustration.png";

export function CartDrawer() {
  const { items, isOpen, setIsOpen, updateQuantity, total, itemCount, error, clearError } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-sm">
        <SheetHeader className="px-4 py-4 border-b text-left flex flex-row items-center gap-3 space-y-0 relative bg-background z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden -ml-2 shrink-0" onClick={() => setIsOpen(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <SheetTitle className="text-xl m-0">Your Cart ({itemCount})</SheetTitle>
          <SheetDescription className="sr-only">
            Review the items in your cart before proceeding to checkout.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-6">
              <img src={emptyCartImg} alt="Empty Cart" className="w-40 h-auto mb-2 mix-blend-multiply" />
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-foreground">Your cart is empty</h3>
                <p className="text-muted-foreground text-sm">Lets add some services</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 hover:text-primary px-8"
              >
                Explore services
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex justify-between items-center">
                  <span>{error}</span>
                  <button onClick={clearError} className="font-bold text-xs ml-2">DATA</button>
                </div>
              )}
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="h-16 w-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-xl">✨</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium line-clamp-2 leading-tight">{item.name}</h4>
                    <p className="text-sm font-semibold">₹{item.price}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center gap-2 border rounded-md p-1 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-6 w-6 flex items-center justify-center hover:bg-muted rounded text-primary"
                      >
                        {item.quantity === 1 ? <Trash2 className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="h-6 w-6 flex items-center justify-center hover:bg-muted rounded text-primary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {items.length > 0 && (
          <div className="border-t p-6 bg-background space-y-4 shadow-lg shadow-black/5 z-10">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Item Total</span>
                <span>₹{total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes & Fees</span>
                <span>₹49</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed">
                <span>Total</span>
                <span>₹{total + 49}</span>
              </div>
            </div>
            <Link href="/checkout">
              <Button className="w-full text-base py-6 shadow-lg shadow-primary/20" size="lg" onClick={() => setIsOpen(false)}>
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
