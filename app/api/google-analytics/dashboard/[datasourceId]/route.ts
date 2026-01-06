import { fetchGADashboardData } from "@/lib/actions/google-analytics-dashboard"
import { createDashboardHandler } from "@/lib/api/dashboard-handler"

/**
 * GET /api/google-analytics/dashboard/[datasourceId]
 * Fetch Google Analytics dashboard data for a specific datasource
 */
export const GET = createDashboardHandler(
  fetchGADashboardData,
  { resourceName: "Google Analytics Dashboard" }
)

