import { fetchMangoolsDashboardData } from "@/lib/actions/mangools-dashboard"
import { createDashboardHandler } from "@/lib/api/dashboard-handler"

/**
 * GET /api/mangools/dashboard/[datasourceId]
 * Fetch Mangools dashboard data for a specific datasource
 */
export const GET = createDashboardHandler(
  fetchMangoolsDashboardData,
  { resourceName: "Mangools Dashboard" }
)

