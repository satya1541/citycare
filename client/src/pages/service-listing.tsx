import { useParams } from "wouter";
import { Header } from "@/components/header";
import { CartDrawer } from "@/components/cart-drawer";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { Star, Clock, ShieldCheck, ChevronLeft, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { ServiceModal } from "@/components/service-modal";
import { getServiceMenusGrouped, getServiceById, getServicesByParent, Service, ServiceGroupedBySubcategory, getImageUrl } from "@/lib/services";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServiceListing() {
    const { id } = useParams();
    const serviceId = parseInt(id || "0");
    const { addItem, items, total, updateQuantity, setIsOpen } = useCart();

    const [service, setService] = useState<Service | null>(null);
    const [groupedMenus, setGroupedMenus] = useState<ServiceGroupedBySubcategory[]>([]);
    const [childServices, setChildServices] = useState<Service[]>([]);
    const [isParent, setIsParent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("");
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!serviceId) return;
            // Reset state when serviceId changes
            setIsParent(false);
            setChildServices([]);
            setGroupedMenus([]);
            setActiveTab("");
            setError(null);
            setLoading(true);
            try {
                const [serviceData, menuData] = await Promise.all([
                    getServiceById(serviceId),
                    getServiceMenusGrouped(serviceId)
                ]);
                setService(serviceData);
                setGroupedMenus(menuData);
                if (menuData.length > 0) {
                    setActiveTab(menuData[0].subcategoryTitle);
                } else {
                    // No menus = this is likely a parent service. Fetch child services.
                    const children = await getServicesByParent(serviceId);
                    if (children.length > 0) {
                        setChildServices(children);
                        setIsParent(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch service details", error);
                setError("Failed to load service details. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serviceId]);

    const getItemQuantity = (id: number) => {
        return items.find(i => i.id === id.toString())?.quantity || 0;
    };

    const scrollToCategory = (categoryName: string) => {
        setActiveTab(categoryName);
        const element = document.getElementById(`category-${categoryName}`);
        if (element) {
            const headerOffset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <Skeleton className="h-12 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-8" />
                    <div className="grid md:grid-cols-[280px_1fr] gap-8">
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-40 w-full rounded-xl" />
                            <Skeleton className="h-40 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck className="h-8 w-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-8 text-center">
                    <h1 className="text-2xl font-bold">Service not found</h1>
                    <Link href="/">
                        <Button className="mt-4">Go Home</Button>
                    </Link>
                </div>
            </div>
        )
    }

    // Parent service view - show child services as clickable cards
    if (isParent && childServices.length > 0) {
        return (
            <div className="min-h-screen bg-secondary/20 font-sans">
                <Header />
                <main className="container mx-auto px-4 py-8 max-w-6xl">
                    <div className="mb-6">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                                <ChevronLeft className="h-4 w-4 mr-1" /> Back to Home
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
                        {service.description && (
                            <p className="text-muted-foreground">{service.description}</p>
                        )}
                    </div>
                    <h2 className="text-xl font-semibold mb-4">Choose a service</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {childServices.map((child) => (
                            <Link key={child.id} href={`/service/${child.id}`}>
                                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group cursor-pointer">
                                    <div className="aspect-[4/3] overflow-hidden">
                                        <img
                                            src={getImageUrl(child.imagePath)}
                                            alt={child.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5em]">{child.name}</h3>
                                        {child.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{child.description}</p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </main>
                <CartDrawer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary/20 font-sans">
            <Header />

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-6">
                    <Link href={`/category/${service.parentId}`}>
                        <Button variant="ghost" size="sm" className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
                            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Categories
                        </Button>
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">{service.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1 font-medium text-foreground">
                                    <Star className="h-4 w-4 fill-primary text-primary" /> 4.8 (2M+ bookings)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-[280px_1fr_350px] gap-8 items-start">

                    {/* Sidebar Navigation - Sticky Redesigned to Grid */}
                    <div className="hidden md:block sticky top-24 pr-4">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                            <h3 className="font-bold text-sm text-gray-500 mb-6 px-1 uppercase tracking-wider">Select a service</h3>
                            <div className="grid grid-cols-3 gap-y-6 gap-x-2">
                                {groupedMenus
                                    .filter(group => group.subcategoryTitle && group.items.some(item => (item as any).isActive))
                                    .map((group) => (
                                        <button
                                            key={group.subcategoryId}
                                            onClick={() => scrollToCategory(group.subcategoryTitle)}
                                            className="flex flex-col items-center gap-2 group outline-none"
                                        >
                                            <div className={`w-16 h-16 rounded-xl overflow-hidden transition-all duration-300 ${activeTab === group.subcategoryTitle
                                                ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md"
                                                : "bg-gray-50 group-hover:bg-gray-100 group-hover:scale-105"
                                                }`}>
                                                <img
                                                    src={getImageUrl(group.subcategoryImagePath)}
                                                    alt={group.subcategoryTitle}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <span className={`text-[11px] leading-tight font-medium text-center transition-colors duration-200 line-clamp-2 px-0.5 ${activeTab === group.subcategoryTitle
                                                ? "text-primary font-bold"
                                                : "text-gray-600 group-hover:text-gray-900"
                                                }`}>
                                                {group.subcategoryTitle}
                                            </span>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-8 min-w-0 flex-1">
                        {/* Mobile Category Scroller */}
                        <div className="md:hidden flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sticky top-[72px] bg-secondary/95 backdrop-blur z-20 pt-2 border-b border-gray-100">
                            {groupedMenus
                                .filter(group => group.subcategoryTitle && group.items.some(item => (item as any).isActive))
                                .map((group) => (
                                    <button
                                        key={group.subcategoryId}
                                        onClick={() => scrollToCategory(group.subcategoryTitle)}
                                        className="flex flex-col items-center gap-1.5 shrink-0 group outline-none"
                                    >
                                        <div className={`w-14 h-14 rounded-xl overflow-hidden transition-all duration-300 ${activeTab === group.subcategoryTitle
                                            ? "ring-2 ring-primary ring-offset-1 scale-105 shadow-sm"
                                            : "bg-white border border-gray-100"
                                            }`}>
                                            <img
                                                src={getImageUrl(group.subcategoryImagePath)}
                                                alt={group.subcategoryTitle}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <span className={`text-[10px] leading-tight font-medium text-center transition-colors duration-200 w-16 line-clamp-2 ${activeTab === group.subcategoryTitle
                                            ? "text-primary font-bold"
                                            : "text-gray-600"
                                            }`}>
                                            {group.subcategoryTitle}
                                        </span>
                                    </button>
                                ))}
                        </div>

                        {groupedMenus.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl border border-border/50">
                                <p className="text-muted-foreground">No services available in this category yet.</p>
                            </div>
                        )}

                        {groupedMenus
                            .filter(group => group.subcategoryTitle && group.items.some(item => (item as any).isActive))
                            .map((group) => (
                                <div key={group.subcategoryId} id={`category-${group.subcategoryTitle}`} className="space-y-4">
                                    <h2 className="text-xl font-bold md:sticky md:top-[72px] bg-secondary md:bg-secondary/95 md:backdrop-blur py-2 z-10">{group.subcategoryTitle}</h2>
                                    {group.items.filter(item => (item as any).isActive).map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-white rounded-xl p-4 md:p-6 border border-border/50 shadow-sm flex gap-4 md:gap-6 hover:shadow-md transition-shadow cursor-pointer group"
                                        // onClick={() => setSelectedItem(item)} // TODO: Open modal for details
                                        >
                                            <div className="flex-1 space-y-2">
                                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">₹{item.basePriceInPaisa / 100}</span>
                                                    {/* Original price logic if available */}
                                                </div>
                                                <div className="w-full h-[1px] bg-border/50 my-3" />
                                                <ul className="space-y-1">
                                                    <li className="text-sm text-muted-foreground flex items-start gap-2">
                                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-muted-foreground" />
                                                        {item.description}
                                                    </li>
                                                </ul>
                                                {/* <Button variant="link" className="p-0 h-auto text-primary text-sm font-semibold mt-2 hover:no-underline hover:opacity-80">View details</Button> */}
                                            </div>

                                            <div className="w-28 md:w-32 flex-shrink-0 relative">
                                                {item.imagePath && (
                                                    <div className="aspect-square rounded-lg overflow-hidden bg-secondary mb-2 relative">
                                                        <img src={getImageUrl(item.imagePath)} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    </div>
                                                )}
                                                <div className={`absolute ${item.imagePath ? '-bottom-3' : 'top-1/2 -translate-y-1/2'} left-1/2 -translate-x-1/2 shadow-lg bg-white rounded-lg`} onClick={e => e.stopPropagation()}>
                                                    {getItemQuantity(item.id) > 0 ? (
                                                        <div className="flex items-center h-9 border rounded-lg bg-primary/5 border-primary/20 overflow-hidden">
                                                            <button className="w-8 h-full flex items-center justify-center text-primary font-bold hover:bg-primary/10 transition-colors"
                                                                onClick={() => updateQuantity(item.id.toString(), -1)}
                                                            >-</button>
                                                            <span className="w-8 text-center text-sm font-semibold text-primary">{getItemQuantity(item.id)}</span>
                                                            <button className="w-8 h-full flex items-center justify-center text-primary font-bold hover:bg-primary/10 transition-colors"
                                                                onClick={() => addItem({ ...item, id: item.id.toString(), menuId: item.id, name: item.title, price: item.basePriceInPaisa / 100, image: getImageUrl(item.imagePath), serviceId })}
                                                            >+</button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="w-24 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary shadow-sm bg-white font-bold"
                                                            onClick={() => addItem({ ...item, id: item.id.toString(), menuId: item.id, name: item.title, price: item.basePriceInPaisa / 100, image: getImageUrl(item.imagePath), serviceId })}
                                                        >
                                                            Add
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                    </div>

                    {/* Cart Sidebar / Promo - Desktop */}
                    <div className="hidden md:block sticky top-24">
                        <div className="bg-white rounded-xl border border-border/50 p-6 shadow-sm mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <ShieldCheck className="h-5 w-5 text-primary mt-1" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">City Cares Promise</h4>
                                    <p className="text-xs text-muted-foreground">Verified Professionals • Insurance Protection</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-border">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">Item Total</span>
                                    <span className="font-medium">₹{total}</span>
                                </div>
                                {total > 0 && (
                                    <div className="flex items-center justify-between font-bold text-lg mt-2">
                                        <span>To Pay</span>
                                        <span>₹{total + 49}</span>
                                    </div>
                                )}
                            </div>

                            <Link href="/checkout" className="block w-full mt-4">
                                <Button className="w-full" size="lg" disabled={total === 0}>
                                    {total === 0 ? "Add items to cart" : "Proceed to Checkout"}
                                </Button>
                            </Link>
                        </div>
                    </div>

                </div>
            </main>

            {/* Mobile Fixed Cart Bar */}
            {items.length > 0 && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] z-40 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground">{items.length} item{items.length > 1 ? 's' : ''}</p>
                        <p className="text-base font-bold text-foreground">₹{total}</p>
                    </div>
                    <Button onClick={() => setIsOpen(true)} className="bg-primary text-white font-bold h-11 px-6 shadow-sm">
                        <ShoppingCart className="w-4 h-4 mr-2" /> View Cart
                    </Button>
                </div>
            )}


            <ServiceModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />

            <CartDrawer />
        </div>
    );
}
