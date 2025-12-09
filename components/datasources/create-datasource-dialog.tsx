"use client"

import type React from "react"

import { useState } from "react"
import { createDatasource } from "@/lib/actions/datasources"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

interface CreateDatasourceDialogProps {
  customerId: string
}

export function CreateDatasourceDialog({ customerId }: CreateDatasourceDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<"mangools" | "semrush">("mangools")
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const result = await createDatasource({ customer_id: customerId, name, type })

    if (result.success) {
      toast({ title: "Data source created", description: `${result.data.name} has been added.` })
      setName("")
      setType("mangools")
      setOpen(false)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Source
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Data Source</DialogTitle>
          <DialogDescription>Add a new SEO data source for this customer</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Main Domain Monitor"
              disabled={loading}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as "mangools" | "semrush")}>
              <SelectTrigger id="type" disabled={loading}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mangools">Mangools</SelectItem>
                <SelectItem value="semrush">SEMrush (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
