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
import { createClient } from "@/lib/actions/clients"
import { Plus, Loader2, AlertCircle } from "lucide-react"
import type { Client } from "@/lib/supabase/types"

interface CreateClientDialogProps {
  onClientAdded?: (client: Client) => void
}

export function CreateClientDialog({ onClientAdded }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notes: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const client = await createClient({
        name: formData.name,
        email: formData.email,
        notes: formData.notes || null,
      })

      setFormData({ name: "", email: "", notes: "" })
      setOpen(false)
      onClientAdded?.(client)
    } catch (error) {
      console.error("Error creating client:", error)
      setError(error instanceof Error ? error.message : "Failed to create client. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && setOpen(open)}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto h-10 sm:h-11 text-sm sm:text-[15px] touch-manipulation">
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] max-h-[90vh] overflow-y-auto" showCloseButton={!loading} onInteractOutside={(e) => loading && e.preventDefault()} onEscapeKeyDown={(e) => loading && e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Add New Client</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Create a new client to manage their projects and data sources.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-sm sm:text-[15px]">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Client name"
                required
                disabled={loading}
                className="h-10 sm:h-11 text-[15px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm sm:text-[15px]">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                required
                disabled={loading}
                className="h-10 sm:h-11 text-[15px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-sm sm:text-[15px]">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes (optional)"
                rows={3}
                disabled={loading}
                className="text-[15px] min-h-[80px]"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm leading-relaxed">{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="h-10 sm:h-11 text-sm sm:text-[15px] flex-1 sm:flex-none touch-manipulation">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-10 sm:h-11 text-sm sm:text-[15px] flex-1 sm:flex-none touch-manipulation">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

