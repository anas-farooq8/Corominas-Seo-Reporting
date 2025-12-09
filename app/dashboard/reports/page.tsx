"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, BarChart3, LineChart } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Advanced SEO reporting and analytics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Performance Reports</CardTitle>
            </div>
            <CardDescription>
              Track keyword rankings and domain performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Domain Analytics</CardTitle>
            </div>
            <CardDescription>
              Comprehensive domain metrics and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Custom Reports</CardTitle>
            </div>
            <CardDescription>
              Create and export custom SEO reports for clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What's Coming</CardTitle>
          <CardDescription>Features planned for the Reports section</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Historical keyword ranking trends and visualizations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Domain authority and SEO metrics tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Automated client report generation and scheduling</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Competitive analysis and comparison tools</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Export reports in multiple formats (PDF, Excel, etc.)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

