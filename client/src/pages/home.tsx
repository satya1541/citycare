import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Categories } from "@/components/categories";
import { ThoughtfulCurations } from "@/components/thoughtful-curations";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { getParentServices, getServicesByParent, getImageUrl, Service } from "@/lib/services";

import { AppLoader } from "@/components/ui/app-loader";
import logoImg from "@assets/citycare-logo_1771322329688.png";

interface ServiceSection {
  parent: Service;
  children: Service[];
}

export default function Home() {
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [parents, setParents] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const parents = await getParentServices();
        setParents(parents);

        // Fetch child services for each parent in parallel
        const sectionsData = await Promise.all(
          parents.map(async (parent) => {
            try {
              const children = await getServicesByParent(parent.id);
              return { parent, children };
            } catch {
              return { parent, children: [] };
            }
          })
        );

        // Show all sections, even if empty (for awareness)
        setSections(sectionsData);
      } catch (error) {
        console.error("Failed to fetch home data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Pick items across sections for "Most Popular"
  const featuredServices = sections
    .flatMap((s) => s.children.map((child) => ({ ...child, parentId: s.parent.id })))
    .slice(0, 6);

  // Alternating section bg colors
  const sectionBg = [
    "bg-secondary/20",
    "",
    "bg-secondary/10",
    "",
    "bg-secondary/20",
    "",
  ];



  return (
    <div className="min-h-screen bg-background font-sans relative">
      {loading && <AppLoader />}
      <Header />
      <main className="pb-12">
        <Hero />

        {/* Dynamic Banners */}
        <section className="py-4 bg-background">
          <div className="container mx-auto px-4">
            <Categories parents={parents} loading={loading} />
          </div>
        </section>

        {/* Thoughtful Curations - Video Section */}
        <ThoughtfulCurations />

        {/* Most Popular Services */}
        <section className="py-8 bg-secondary/20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Most popular services</h2>
            {featuredServices.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {featuredServices.map((service) => (
                  <Link key={service.id} href={`/service/${service.id}`}>
                    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 group cursor-pointer">
                      <div className="aspect-square overflow-hidden">
                        <img
                          src={getImageUrl(service.imagePath)}
                          alt={service.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-center leading-tight line-clamp-2">{service.name}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No services available yet.</p>
            )}
          </div>
        </section>

        {/* Dynamic Sections from Parent Categories */}
        {sections
          .filter((s) => s.children.length > 0)
          .map((section, idx) => (
            <section key={section.parent.id} className={`py-8 ${sectionBg[idx % sectionBg.length]}`}>
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">{section.parent.name}</h2>
                </div>
                {section.parent.description && (
                  <p className="text-sm text-muted-foreground mb-6">{section.parent.description}</p>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {section.children.map((child) => (
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
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{child.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ))}



      </main >

      <Footer />

      <CartDrawer />
    </div >
  );
}
