"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorDisplay } from "@/components/ui/error-display"
import { FileText, Plus, ChevronRight, ChevronDown, ExternalLink, Calendar } from "lucide-react"
import type { Report, ReportWithLinks } from "@/lib/supabase/types"

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [currentMonthExists, setCurrentMonthExists] = useState(false)
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)
  const [expandedReportData, setExpandedReportData] = useState<ReportWithLinks | null>(null)
  const [loadingReportDetails, setLoadingReportDetails] = useState(false)
  const [generating, setGenerating] = useState(false)

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  useEffect(() => {
    fetchReports()
    checkCurrentMonth()
  }, [])

  async function fetchReports() {
    try {
      setLoading(true)
      const response = await fetch("/api/reports")
      if (!response.ok) throw new Error("Failed to fetch reports")
      const data = await response.json()
      setReports(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reports")
    } finally {
      setLoading(false)
    }
  }

  async function checkCurrentMonth() {
    try {
      const response = await fetch("/api/reports/current-month")
      if (!response.ok) throw new Error("Failed to check current month")
      const data = await response.json()
      setCurrentMonthExists(data.exists)
    } catch (err) {
      console.error("Error checking current month:", err)
    }
  }

  async function handleGenerateReports() {
    try {
      setGenerating(true)
      const response = await fetch("/api/reports", {
        method: "POST"
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate reports")
      }
      
      const data = await response.json()
      
      // Refresh the reports list
      await fetchReports()
      setCurrentMonthExists(true)
      
      alert(`Successfully generated ${data.generated_count} report links!`)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate reports")
    } finally {
      setGenerating(false)
    }
  }

  async function toggleReportExpansion(reportId: string) {
    if (expandedReportId === reportId) {
      setExpandedReportId(null)
      setExpandedReportData(null)
    } else {
      setExpandedReportId(reportId)
      setLoadingReportDetails(true)
      
      try {
        const response = await fetch(`/api/reports/${reportId}`)
        if (!response.ok) throw new Error("Failed to fetch report details")
        const data = await response.json()
        setExpandedReportData(data)
      } catch (err) {
        console.error("Error fetching report details:", err)
        alert("Failed to load report details")
      } finally {
        setLoadingReportDetails(false)
      }
    }
  }

  function copyLinkToClipboard(token: string) {
    const link = `${window.location.origin}/report/${token}`
    navigator.clipboard.writeText(link)
    alert("Link copied to clipboard!")
  }

  // Group report links by client
  function groupLinksByClient(reportData: ReportWithLinks | null) {
    if (!reportData || !reportData.report_links) return []
    
    const grouped = new Map()
    
    for (const link of reportData.report_links) {
      if (!link.client) continue
      
      if (!grouped.has(link.client.id)) {
        grouped.set(link.client.id, {
          client: link.client,
          projects: []
        })
      }
      
      grouped.get(link.client.id).projects.push({
        project: link.project,
        token: link.token,
        locked_today_date: link.locked_today_date,
        first_opened_at: link.first_opened_at
      })
    }
    
    return Array.from(grouped.values())
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Generate and manage monthly client reports
        </p>
      </div>

      {/* Current Month Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Current Month</CardTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentMonthExists ? (
            <p className="text-sm text-muted-foreground">
              Reports for this month have already been generated.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Reports for this month have not been generated yet.
              </p>
              <Button 
                onClick={handleGenerateReports}
                disabled={generating}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                {generating ? "Generating..." : "Generate All Reports"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>View and manage all generated monthly reports</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner message="Loading reports..." variant="card" />
          ) : error ? (
            <ErrorDisplay 
              title="Failed to Load Reports" 
              message={error}
              variant="card"
            />
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No reports generated yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg">
                  <button
                    onClick={() => toggleReportExpansion(report.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-left">
                      {expandedReportId === report.id ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium">
                          {MONTH_NAMES[report.month - 1]} {report.year}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Loading...
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(report.generation_date).toLocaleDateString()}
                    </div>
                  </button>

                  {expandedReportId === report.id && (
                    <div className="border-t p-4">
                      {loadingReportDetails ? (
                        <LoadingSpinner message="Loading report details..." variant="card" />
                      ) : expandedReportData ? (
                        <>
                          <div className="text-sm text-muted-foreground mb-4">
                            {expandedReportData.report_links?.length || 0} report{expandedReportData.report_links?.length !== 1 ? 's' : ''} generated
                          </div>
                          <div className="space-y-4">
                            {groupLinksByClient(expandedReportData).map((group) => (
                            <div key={group.client.id} className="space-y-2">
                              <div className="font-medium text-sm">{group.client.name}</div>
                              <div className="pl-4 space-y-1">
                                {group.projects.map((proj: any) => (
                                  <div 
                                    key={proj.token} 
                                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                                  >
                                    <div className="flex-1">
                                      <div className="text-sm">{proj.project.name}</div>
                                      {proj.locked_today_date && (
                                        <div className="text-xs text-muted-foreground">
                                          Opened: {new Date(proj.first_opened_at).toLocaleDateString()} 
                                          {' '}(locked to {proj.locked_today_date})
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyLinkToClipboard(proj.token)}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data available</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

