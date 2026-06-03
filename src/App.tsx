import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import RequireAuth from "@/components/RequireAuth";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index";
import Garages from "./pages/Garages";
import GarageDetail from "./pages/GarageDetail";
import SpareParts from "./pages/SpareParts";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import Chat from "./pages/Chat";
import Cart from "./pages/Cart";
import Settings from "./pages/Settings";
import MyOrders from "./pages/MyOrders";
import Wallet from "./pages/Wallet";
import Receipt from "./pages/Receipt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/garages" element={<Garages />} />
            <Route path="/garages/:id" element={<GarageDetail />} />
            <Route path="/spare-parts" element={<SpareParts />} />
            <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/my-orders" element={<RequireAuth><MyOrders /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<RequireAuth><AdminPanel /></RequireAuth>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
            <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/wallet" element={<RequireAuth><Wallet /></RequireAuth>} />
            <Route path="/receipt/:orderId" element={<RequireAuth><Receipt /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
