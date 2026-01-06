import { fetchGSCDashboardData } from "@/lib/actions/search-console-dashboard"
import { createDashboardHandler } from "@/lib/api/dashboard-handler"

/**
 * GET /api/search-console/dashboard/[datasourceId]
 * Fetch Google Search Console dashboard data for a specific datasource
 */
export const GET = createDashboardHandler(
  fetchGSCDashboardData,
  { resourceName: "Google Search Console Dashboard" }
)

