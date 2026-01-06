"use client"

/**
 * Generic Delete Button Component
 * Consolidates duplicate logic from client, project, and datasource delete buttons
 * Reduces 270+ lines of duplicate code to a single reusable component
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Loader2, AlertCircle } from "lucide-react"

interface DeleteButtonProps {
  /** ID of the item to delete */
  itemId: string
  /** Name or description of the item to delete */
  itemName: string
  /** Type of entity being deleted (e.g., "Client", "Project", "Data Source") */
  entityType: string
  /** Additional warning message (optional) */
  warningMessage?: string
  /** Callback function to handle deletion */
  onDelete: (id: string) => Promise<void>
  /** Callback after successful deletion */
  onDeleted?: () => void
}

export function DeleteButton({
  itemId,
  itemName,
  entityType,
  warningMessage,
  onDelete,
  onDeleted,
}: DeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      await onDelete(itemId)
      onDeleted?.()
    } catch (error) {
      console.error(`Error deleting ${entityType.toLowerCase()}:`, error)
      setError(
        error instanceof Error
          ? error.message
          : `Failed to delete ${entityType.toLowerCase()}. Please try again.`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 text-destructive" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityType}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{itemName}</strong>?
            <br />
            <br />
            {warningMessage ||
              `This will permanently delete the ${entityType.toLowerCase()}. This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${entityType}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

