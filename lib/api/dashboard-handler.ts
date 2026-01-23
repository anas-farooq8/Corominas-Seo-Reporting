/**
 * Generic Dashboard API Handler
 * Consolidates duplicate logic across all dashboard API routes
 * Reduces 95% code duplication from 6 different route files
 */

import { NextRequest, NextResponse } from "next/server"

/**
 * Dashboard options interface
 */
export interface DashboardOptions {
  today?: string // Optional locked today date (YYYY-MM-DD) for report links
}

/**
 * Generic handler for dashboard data fetching
 * @param fetchFn - Function that fetches dashboard data given a datasourceId and options
 * @param options - Optional configuration for error messages
 */
export function createDashboardHandler<T>(
  fetchFn: (datasourceId: string, options?: DashboardOptions) => Promise<T | null>,
  options?: {
    resourceName?: string
    requireDatasourceId?: boolean
  }
) {
  return async (
    request: NextRequest,
    { params }: { params: Promise<{ datasourceId: string }> }
  ) => {
    try {
      const { datasourceId } = await params
      
      // Validate datasourceId if required (some routes may want this validation)
      if (options?.requireDatasourceId && !datasourceId) {
        return NextResponse.json(
          { error: "Datasource ID is required" },
          { status: 400 }
        )
      }

      // Extract today query parameter for report links
      const today = request.nextUrl.searchParams.get('today') || undefined

      const resourceName = options?.resourceName || "dashboard"
      console.log(`[${resourceName} API] Fetching data for datasource: ${datasourceId}${today ? ` (today: ${today})` : ''}`)

      const data = await fetchFn(datasourceId, { today })

      if (!data) {
        return NextResponse.json(
          { error: `${resourceName} data not found` },
          { status: 404 }
        )
      }

      return NextResponse.json(data)
    } catch (error) {
      const resourceName = options?.resourceName || "dashboard"
      console.error(`[${resourceName} API] Error:`, error)
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : `Failed to fetch ${resourceName} data`
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  }
}

