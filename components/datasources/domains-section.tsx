import { getMangoolsDomains } from "@/lib/db/datasources"
import { AttachedDomainsSection } from "./attached-domains-section"

interface DomainsSectionProps {
  datasourceId: string
}

export async function DomainsSection({ datasourceId }: DomainsSectionProps) {
  const attachedDomains = await getMangoolsDomains(datasourceId)

  return (
    <div className="space-y-4">
      <AttachedDomainsSection datasourceId={datasourceId} attachedDomains={attachedDomains} />
    </div>
  )
}
