"use server"

import { createClient } from "@/lib/supabase/server"
import type { Report, ReportLink, ReportWithLinks, ReportLinkWithDetails } from "@/lib/supabase/types"
import { randomBytes } from "crypto"

/**
 * Generate a unique token for shareable links
 */
function generateToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Get all reports sorted by date (desc)
 */
export async function getAllReports(): Promise<ReportWithLinks[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
  
  if (error) {
    console.error("Error fetching reports:", error)
    throw new Error("Failed to fetch reports")
  }
  
  return data as ReportWithLinks[]
}

/**
 * Get a specific report by month and year
 */
export async function getReportByMonthYear(month: number, year: number): Promise<Report | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("month", month)
    .eq("year", year)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error("Error fetching report:", error)
    throw new Error("Failed to fetch report")
  }
  
  return data as Report
}

/**
 * Get report with all its links and related client/project data
 */
export async function getReportWithLinks(reportId: string): Promise<ReportWithLinks | null> {
  const supabase = await createClient()
  
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .single()
  
  if (reportError) {
    console.error("Error fetching report:", reportError)
    throw new Error("Failed to fetch report")
  }
  
  const { data: links, error: linksError } = await supabase
    .from("report_links")
    .select(`
      *,
      client:clients(*),
      project:projects(*)
    `)
    .eq("report_id", reportId)
    .order("created_at", { ascending: false })
  
  if (linksError) {
    console.error("Error fetching report links:", linksError)
    throw new Error("Failed to fetch report links")
  }
  
  return {
    ...report,
    report_links: links as ReportLinkWithDetails[]
  } as ReportWithLinks
}

/**
 * Get report link by token
 */
export async function getReportLinkByToken(token: string): Promise<ReportLinkWithDetails | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("report_links")
    .select(`
      *,
      client:clients(*),
      project:projects(*),
      report:reports(*)
    `)
    .eq("token", token)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error("Error fetching report link:", error)
    throw new Error("Failed to fetch report link")
  }
  
  return data as ReportLinkWithDetails
}

/**
 * Lock the today date for a report link on first access
 */
export async function lockReportLinkTodayDate(
  linkId: string,
  todayDate: string
): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("report_links")
    .update({
      locked_today_date: todayDate,
      first_opened_at: new Date().toISOString()
    })
    .eq("id", linkId)
    .is("locked_today_date", null) // Only update if not already locked
  
  if (error) {
    console.error("Error locking report link today date:", error)
    return false
  }
  
  return true
}

/**
 * Create a new report
 */
export async function createReport(
  month: number,
  year: number
): Promise<Report> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("reports")
    .insert({
      month,
      year,
      generation_date: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    console.error("Error creating report:", error)
    throw new Error("Failed to create report")
  }
  
  return data as Report
}

/**
 * Generate report links for all client-project combinations
 */
export async function generateReportLinks(reportId: string): Promise<{ count: number, links: ReportLink[] }> {
  const supabase = await createClient()
  
  // Get all clients with their projects
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select(`
      id,
      projects(id)
    `)
  
  if (clientsError) {
    console.error("Error fetching clients:", clientsError)
    throw new Error("Failed to fetch clients")
  }
  
  // Generate links for each client-project combination
  const linksToCreate: any[] = []
  
  for (const client of clients) {
    if (client.projects && Array.isArray(client.projects)) {
      for (const project of client.projects) {
        linksToCreate.push({
          report_id: reportId,
          client_id: client.id,
          project_id: project.id,
          token: generateToken()
        })
      }
    }
  }
  
  if (linksToCreate.length === 0) {
    return { count: 0, links: [] }
  }
  
  // Insert all links
  const { data: links, error: linksError } = await supabase
    .from("report_links")
    .insert(linksToCreate)
    .select()
  
  if (linksError) {
    console.error("Error creating report links:", linksError)
    throw new Error("Failed to create report links")
  }
  
  return { count: links.length, links: links as ReportLink[] }
}

/**
 * Check if a report exists for current month
 */
export async function getCurrentMonthReport(): Promise<Report | null> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  
  return getReportByMonthYear(month, year)
}
