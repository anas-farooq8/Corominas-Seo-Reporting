"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createProject } from "@/lib/actions/projects"
import { Plus, Loader2, AlertCircle } from "lucide-react"
import type { Project } from "@/lib/supabase/types"

interface CreateProjectDialogProps {
  clientId: string
  onProjectAdded?: (project: Project) => void
}

export function CreateProjectDialog({ clientId, onProjectAdded }: CreateProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    details: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const project = await createProject({
        client_id: clientId,
        name: formData.name,
        details: formData.details || null,
      })

      setFormData({ name: "", details: "" })
      setOpen(false)
      onProjectAdded?.(project)
    } catch (error) {
      console.error("Error creating project:", error)
      setError(error instanceof Error ? error.message : "Failed to create project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && setOpen(open)}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm touch-manipulation">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[400px] max-h-[90vh] overflow-y-auto" showCloseButton={!loading} onInteractOutside={(e) => loading && e.preventDefault()} onEscapeKeyDown={(e) => loading && e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base sm:text-lg">Add New Project</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm leading-relaxed">
              Create a new project for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-xs sm:text-sm">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Website Redesign"
                required
                disabled={loading}
                className="h-9 text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="details" className="text-xs sm:text-sm">Details</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Project description and details (optional)"
                rows={3}
                disabled={loading}
                className="text-sm min-h-[70px]"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="text-xs sm:text-sm py-2">
                <AlertCircle className="h-3.5 w-3.5" />
                <AlertDescription className="text-xs sm:text-sm leading-relaxed">{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none touch-manipulation">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-8 sm:h-9 text-xs sm:text-sm flex-1 sm:flex-none touch-manipulation">
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

