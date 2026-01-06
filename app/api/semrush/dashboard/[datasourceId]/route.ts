import { fetchSEMrushDashboard } from "@/lib/actions/semrush-dashboard"
import { createDashboardHandler } from "@/lib/api/dashboard-handler"

/**
 * GET /api/semrush/dashboard/[datasourceId]
 * Fetch SEMrush dashboard data for a specific datasource
 */
export const GET = createDashboardHandler(
  fetchSEMrushDashboard,
  { resourceName: "SEMrush Dashboard", requireDatasourceId: true }
)

