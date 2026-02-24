import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { cn } from "./lib/utils";

import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

// Lazy load pages for code splitting
const Home = lazy(() => import("@/pages/home"));
const Category = lazy(() => import("@/pages/category"));
const Checkout = lazy(() => import("@/pages/checkout"));
const ServiceListing = lazy(() => import("@/pages/service-listing"));
const BookingSuccess = lazy(() => import("@/pages/booking-success"));
const LoginPage = lazy(() => import("@/pages/login-page"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const NotFound = lazy(() => import("@/pages/not-found"));

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, user } = useAuth();

  // Wait for initial load if needed? 
  // For now, assuming isAuthenticated check is synchronous relative to this render 
  // or user state is initialized from local storage in AuthProvider.

  // Note: AuthProvider initializes user from localStorage, so it should be available immediately if present.

  return (
    <Route {...rest}>
      {(params) => (
        isAuthenticated ? <Component params={params} /> : <Redirect to="/login" />
      )}
    </Route>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className={cn(
      "mx-auto w-full min-h-screen relative",
      !isLoginPage && "max-w-[1280px]"
    )}>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh] w-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <Switch>
          <Route path="/login" component={LoginPage} />

          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/category/:slug" component={Category} />
          <Route path="/service/:id" component={ServiceListing} />
          <ProtectedRoute path="/checkout" component={Checkout} />

          <ProtectedRoute path="/booking-success" component={BookingSuccess} />

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>

            <Router />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
