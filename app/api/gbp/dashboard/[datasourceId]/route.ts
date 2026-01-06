import { fetchGBPDashboardData } from "@/lib/actions/gbp-dashboard"
import { createDashboardHandler } from "@/lib/api/dashboard-handler"

/**
 * GET /api/gbp/dashboard/[datasourceId]
 * Fetch Google Business Profile activity dashboard data for a specific datasource
 */
export const GET = createDashboardHandler(
  fetchGBPDashboardData,
  { resourceName: "GBP Dashboard", requireDatasourceId: true }
)

