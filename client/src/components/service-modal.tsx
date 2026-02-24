import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/lib/cart-context";
import { Clock, Star, ShieldCheck, CheckCircle2 } from "lucide-react";

export type ServiceItem = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  description: string;
  time: string;
  image: string;
  menuId: number; // Added
};

interface ServiceModalProps {
  item: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ServiceModal({ item, isOpen, onClose }: ServiceModalProps) {
  const { addItem, items, updateQuantity } = useCart();

  if (!item) return null;

  const cartItem = items.find(i => i.id === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <DialogDescription className="sr-only">
          Details about {item.name} including price, description, and quantity.
        </DialogDescription>
        <div className="relative h-48 sm:h-56 w-full bg-secondary">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
            <h2 className="text-white text-2xl font-bold leading-tight shadow-sm">{item.name}</h2>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold">₹{item.price}</span>
                  <span className="text-muted-foreground line-through">₹{item.originalPrice}</span>
                  <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-0.5 rounded">
                    {Math.round((1 - item.price / item.originalPrice) * 100)}% OFF
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{item.time}</span>
                </div>
              </div>

              {quantity > 0 ? (
                <div className="flex items-center h-10 border rounded-lg bg-primary/5 border-primary/20 overflow-hidden shadow-sm">
                  <button
                    className="w-10 h-full flex items-center justify-center text-primary font-bold hover:bg-primary/10 text-lg"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold text-primary">{quantity}</span>
                  <button
                    className="w-10 h-full flex items-center justify-center text-primary font-bold hover:bg-primary/10 text-lg"
                    onClick={() => addItem(item)}
                  >
                    +
                  </button>
                </div>
              ) : (
                <Button onClick={() => addItem(item)} className="px-8 shadow-md">Add</Button>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">About this service</h3>
              <p className="text-muted-foreground leading-relaxed">
                {item.description} Includes complete checkup, diagnosis, and expert service.
                Parts replacement extra if required.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>30 Days Warranty</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Background Verified</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>On-time Guarantee</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Safe & Hygienic</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Customer Reviews</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-sm font-bold">
                  4.8 <Star className="h-3 w-3 fill-white" />
                </div>
                <span className="text-sm text-muted-foreground">based on 12k+ reviews</span>
              </div>

              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-secondary/30 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">Happy Customer</span>
                      <span className="text-xs text-muted-foreground">2 days ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Excellent service! The professional arrived on time and did a great job. Very polite and efficient.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
