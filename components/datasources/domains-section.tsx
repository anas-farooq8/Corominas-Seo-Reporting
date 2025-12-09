import { getMangoolsDomains } from "@/lib/db/datasources"
import { AvailableDomainsSection } from "./available-domains-section"
import { AttachedDomainsSection } from "./attached-domains-section"

interface DomainsSectionProps {
  datasourceId: string
}

export async function DomainsSection({ datasourceId }: DomainsSectionProps) {
  const attachedDomains = await getMangoolsDomains(datasourceId)

  return (
    <div className="space-y-6">
      <AvailableDomainsSection datasourceId={datasourceId} attachedDomains={attachedDomains} />
      <AttachedDomainsSection datasourceId={datasourceId} attachedDomains={attachedDomains} />
    </div>
  )
}
