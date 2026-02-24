import { Project } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DetailRow } from '@/components/DetailRow'
import { safeFormat } from '@/lib/utils'
import { User, FileText, MapPin, Activity, Calendar } from 'lucide-react'

interface ObraGeralTabProps {
  project: Project
}

export function ObraGeralTab({ project }: ObraGeralTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow label="Cliente" value={project.client} icon={User} />
          <Separator />
          <DetailRow label="CNPJ" value={project.cnpj} icon={FileText} />
          <Separator />
          <DetailRow
            label="Endereço"
            value={`${project.address}, ${project.city} - ${project.state}`}
            icon={MapPin}
          />
          <Separator />
          <DetailRow label="Status do Projeto" icon={Activity}>
            <span className="capitalize font-bold text-foreground">
              {project.status}
            </span>
          </DetailRow>
        </CardContent>
      </Card>

      {/* Timelines Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Prazos e Datas</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow label="Data de Início" icon={Calendar}>
            <div className="flex items-center gap-2 justify-end">
              {safeFormat(project.startDate, 'dd/MM/yyyy')}
            </div>
          </DetailRow>
          <Separator />
          <DetailRow label="Previsão de Término" icon={Calendar}>
            <div className="flex items-center gap-2 justify-end">
              {safeFormat(project.predictedEndDate, 'dd/MM/yyyy')}
            </div>
          </DetailRow>
        </CardContent>
      </Card>
    </div>
  )
}
