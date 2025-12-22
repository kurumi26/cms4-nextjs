import AdminLayout from "@/components/Layout/AdminLayout";
import WebsiteSummary from "@/components/UI/WebsiteSummary";
import RecentActivity from "@/components/UI/RecentActivity";
import StatsCards from "@/components/UI/StatsCards";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/dashboardService";

export default function DashboardIndex() {
  const [stats, setStats] = useState({
    pages: 0,
    albums: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats({
          pages: res.data.data.pages_count,
          albums: res.data.data.albums_count,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container">
      <h3 className="mb-4">Welcome, Adminz!</h3>

      <StatsCards
        pagesCount={stats.pages}
        albumsCount={stats.albums}
      />

      <section className="row mb-4">
        <div className="col-md-4">
          <WebsiteSummary />
        </div>

        <div className="col-md-8">
          <RecentActivity />
        </div>
      </section>
    </div>
  );
}

DashboardIndex.Layout = AdminLayout;
