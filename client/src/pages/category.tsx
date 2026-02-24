import { useParams } from "wouter";
import { Header } from "@/components/header";
import { getServicesByParent, getServiceById, Service, getImageUrl } from "@/lib/services";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Category() {
  const { slug } = useParams();
  // Slug here is actually the ID
  const categoryId = parseInt(slug || "0");

  const [category, setCategory] = useState<Service | null>(null);
  const [subServices, setSubServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!categoryId) return;
      try {
        const [catData, subData] = await Promise.all([
          getServiceById(categoryId),
          getServicesByParent(categoryId)
        ]);
        setCategory(catData);
        setSubServices(subData);
      } catch (error) {
        console.error("Failed to fetch category details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoryId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Category not found</h1>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{category.name}</h1>
        <p className="text-muted-foreground mb-8 text-lg">{category.description || `Best ${category.name} services in town`}</p>

        {/* Promo / Trust markers could go here */}

        <h2 className="text-xl font-bold mb-6">Select a Service</h2>

        {subServices.length === 0 ? (
          <div className="text-center py-12 bg-secondary/20 rounded-xl">
            <p className="text-muted-foreground">No services available in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subServices.map((service) => (
              <Link key={service.id} href={`/service/${service.id}`}>
                <div className="group bg-white border border-border/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    {service.imagePath ? (
                      <img src={getImageUrl(service.imagePath)} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                        <Star className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">{service.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{service.description || "Professional service at your doorstep"}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
