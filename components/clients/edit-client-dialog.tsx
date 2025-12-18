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
import { updateClient } from "@/lib/actions/clients"
import { Pencil, Loader2, AlertCircle } from "lucide-react"
import type { Client } from "@/lib/supabase/types"

interface EditClientDialogProps {
  client: Client
  onClientUpdated?: (client: Client) => void
}

export function EditClientDialog({ client, onClientUpdated }: EditClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email,
    notes: client.notes || "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const updatedClient = await updateClient(client.id, {
        name: formData.name,
        email: formData.email,
        notes: formData.notes || null,
      })

      setOpen(false)
      onClientUpdated?.(updatedClient)
    } catch (error) {
      console.error("Error updating client:", error)
      setError(error instanceof Error ? error.message : "Failed to update client. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && setOpen(open)}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 touch-manipulation">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[425px] max-h-[90vh] overflow-y-auto" showCloseButton={!loading} onInteractOutside={(e) => loading && e.preventDefault()} onEscapeKeyDown={(e) => loading && e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base sm:text-lg">Edit Client</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm leading-relaxed">
              Update client information and details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name" className="text-xs sm:text-sm">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Client name"
                required
                disabled={loading}
                className="h-9 text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-email" className="text-xs sm:text-sm">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@example.com"
                required
                disabled={loading}
                className="h-9 text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="edit-notes" className="text-xs sm:text-sm">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes (optional)"
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
                  Updating...
                </>
              ) : (
                "Update Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

