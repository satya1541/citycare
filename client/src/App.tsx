import { useEffect } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { cn } from "./lib/utils";

import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Category from "@/pages/category";
import Checkout from "@/pages/checkout";

import ServiceListing from "@/pages/service-listing";
import BookingSuccess from "@/pages/booking-success";
import LoginPage from "@/pages/login-page";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import { CartProvider } from "@/lib/cart-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";

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
