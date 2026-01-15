import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SafeTooltipProvider } from "@/components/ui/SafeTooltipProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Meteors } from "@/components/effects/MeteorBackground";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Chat from "./pages/Chat";
import Contacts from "./pages/Contacts";
import ContactProfile from "./pages/ContactProfile";
import ContentLibraryPage from "./pages/ContentLibraryPage";
import Campaigns from "./pages/Campaigns";
import KnowledgeBase from "./pages/KnowledgeBase";
import Cases from "./pages/Cases";
import TrustBuilderView from "./pages/TrustBuilderView";
import Inbox from "./pages/Inbox";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SafeTooltipProvider>
      <Toaster />
      <Sonner />
      {/* Global Meteor Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <Meteors number={15} />
      </div>
      <BrowserRouter>
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/:id" element={<ContactProfile />} />
            <Route path="/content-library" element={<ContentLibraryPage />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/client/:token" element={<TrustBuilderView />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </SafeTooltipProvider>
  </QueryClientProvider>
);

export default App;