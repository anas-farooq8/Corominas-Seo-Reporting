import { fetchGALandingPagesDashboard } from "@/lib/actions/google-analytics-landing-pages"
import { createDashboardHandler } from "@/lib/api/dashboard-handler"

/**
 * GET /api/google-analytics/landing-pages/[datasourceId]
 * Fetch Google Analytics landing pages data for a specific datasource
 */
export const GET = createDashboardHandler(
  fetchGALandingPagesDashboard,
  { resourceName: "Google Analytics Landing Pages" }
)

