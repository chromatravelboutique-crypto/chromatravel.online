import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { BrandProvider } from "@/lib/brand-context";
import { CookieConsent } from "@/components/cookie-consent";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { PerformanceProvider } from "@/components/three-webgl";
import Home from "@/pages/home";
import Hotels from "@/pages/hotels";
import HotelDetail from "@/pages/hotel-detail";
import Booking from "@/pages/booking";
import Destinations from "@/pages/destinations";
import Experiences from "@/pages/experiences";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Contact from "@/pages/contact";
import About from "@/pages/about";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsAndConditions from "@/pages/terms-and-conditions";
import CookiePolicy from "@/pages/cookie-policy";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import Dashboard from "@/pages/dashboard";
import AccountPage from "@/pages/account";
import LGBTPage from "@/pages/lgbt";
import ProductsManagement from "@/pages/dashboard/products-management";
import LeadsManagement from "@/pages/dashboard/leads-management";
import BookingsManagement from "@/pages/dashboard/bookings-management";
import CustomersManagement from "@/pages/dashboard/customers-management";
import Reports from "@/pages/dashboard/reports";
import BlogDashboard from "@/pages/dashboard/blog";
import MediaLibrary from "@/pages/dashboard/media";
import SocialDashboard from "@/pages/dashboard/social";
import InvoicingDashboard from "@/pages/dashboard/invoicing";
import CRMLeadsPage from "@/pages/dashboard/crm-leads";
import AdminTBOCertification from "@/pages/Admin/AdminTBOCertification";
import AdminCRM from "@/pages/Admin/AdminCRM";
import AdminInventory from "@/pages/Admin/AdminInventory";
import AdminMetrics from "@/pages/Admin/AdminMetrics";
import Ofertas from "@/pages/ofertas";
import NotFound from "@/pages/not-found";
import Bloqueos from "@/pages/Bloqueos";
import XcaretFamilias from "@/pages/landings/xcaret-familias";
import XcaretAparta2027 from "@/pages/landings/xcaret-aparta-2027";
import XcaretBodas from "@/pages/landings/xcaret-bodas";
import XcaretLunaMiel from "@/pages/landings/xcaret-luna-miel";
import XcaretArteLgbt from "@/pages/landings/xcaret-arte-lgbt";
import XcaretFiesta from "@/pages/landings/xcaret-fiesta";
import XcaretBodaSimbolica from "@/pages/landings/xcaret-boda-simbolica";
import XcaretLunaMielAdults from "@/pages/landings/xcaret-luna-miel-adults";
import HotelSearch from "@/pages/hotel-search";
import HotelBooking from "@/pages/hotel-booking";
import Grupos from "@/pages/grupos";
import Bodas from "@/pages/bodas";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hotels" component={Hotels} />
      <Route path="/hotel-search" component={HotelSearch} />
      <Route path="/hotel-booking" component={HotelBooking} />
      <Route path="/hotels/:id" component={HotelDetail} />
      <Route path="/booking/:hotelId" component={Booking} />
      <Route path="/destinations" component={Destinations} />
      <Route path="/destinations/:id" component={Destinations} />
      <Route path="/ofertas" component={Ofertas} />
      <Route path="/experiences" component={Experiences} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms-and-conditions" component={TermsAndConditions} />
      <Route path="/cookie-policy" component={CookiePolicy} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/products" component={ProductsManagement} />
      <Route path="/dashboard/leads" component={LeadsManagement} />
      <Route path="/dashboard/bookings" component={BookingsManagement} />
      <Route path="/dashboard/customers" component={CustomersManagement} />
      <Route path="/dashboard/reports" component={Reports} />
      <Route path="/dashboard/blog" component={BlogDashboard} />
      <Route path="/dashboard/media" component={MediaLibrary} />
      <Route path="/dashboard/social" component={SocialDashboard} />
      <Route path="/dashboard/invoicing" component={InvoicingDashboard} />
      <Route path="/dashboard/crm" component={CRMLeadsPage} />
      <Route path="/admin/tbo/certification" component={AdminTBOCertification} />
      <Route path="/admin/crm" component={AdminCRM} />
      <Route path="/admin/inventory" component={AdminInventory} />
      <Route path="/admin/metrics" component={AdminMetrics} />
      <Route path="/dashboard/:section" component={Dashboard} />
      <Route path="/account" component={AccountPage} />
      <Route path="/account/:section" component={AccountPage} />
      <Route path="/lgbt" component={LGBTPage} />
      <Route path="/pride" component={LGBTPage} />
      <Route path="/bloqueos" component={Bloqueos} />
      <Route path="/grupos" component={Grupos} />
      <Route path="/bodas" component={Bodas} />
      {/* Fenix Traveler — Xcaret Landings */}
      <Route path="/xcaret-familias" component={XcaretFamilias} />
      <Route path="/xcaret-aparta-2027" component={XcaretAparta2027} />
      <Route path="/xcaret-bodas" component={XcaretBodas} />
      <Route path="/xcaret-luna-miel" component={XcaretLunaMiel} />
      {/* Chroma Travel — Xcaret Arte Landings */}
      <Route path="/xcaret-arte-lgbt" component={XcaretArteLgbt} />
      <Route path="/xcaret-fiesta" component={XcaretFiesta} />
      <Route path="/xcaret-boda-simbolica" component={XcaretBodaSimbolica} />
      <Route path="/xcaret-luna-miel-adults" component={XcaretLunaMielAdults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <BrandProvider>
          <AuthProvider>
            <PerformanceProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
                <WhatsAppButton />
                <CookieConsent />
              </TooltipProvider>
            </PerformanceProvider>
          </AuthProvider>
        </BrandProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
