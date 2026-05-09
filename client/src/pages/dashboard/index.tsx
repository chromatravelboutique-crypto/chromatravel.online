import { useAuth, ProtectedRoute } from "@/lib/auth";
import AdminDashboard from "./admin-dashboard";
import AgentDashboard from "./agent-dashboard";
import MarketingDashboard from "./marketing-dashboard";

function DashboardContent() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "agent":
      return <AgentDashboard />;
    case "marketing":
      return <MarketingDashboard />;
    default:
      return null;
  }
}

export default function Dashboard() {
  return (
    <ProtectedRoute roles={["admin", "agent", "marketing"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
