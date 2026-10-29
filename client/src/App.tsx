import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/contexts/StoreContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import BrandColors from "@/components/BrandColors";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import CartPage from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Favorites from "@/pages/Favorites";
import Admin from "@/pages/Admin";

function AppRouter() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <BrandColors />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/shop" component={Shop} />
          <Route path="/shop/:category" component={Shop} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/cart" component={CartPage} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StoreProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </StoreProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
