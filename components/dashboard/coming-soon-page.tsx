"use client"

import { Construction } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface ComingSoonPageProps {
  pageName: string
}

export function ComingSoonPage({ pageName }: ComingSoonPageProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-full p-4">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="rounded-full bg-primary/10 p-6 mb-6">
            <Construction className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">
            Coming Soon
          </h2>
          <p className="text-muted-foreground mb-2">
            {pageName} dashboard is under development
          </p>
          <p className="text-sm text-muted-foreground">
            We're working hard to bring you comprehensive analytics. Stay tuned!
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

