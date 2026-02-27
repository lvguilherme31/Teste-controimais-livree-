import { Employee } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DetailRow } from '@/components/DetailRow'
import { safeFormat } from '@/lib/utils'
import { User, FileText, MapPin, Activity, Calendar, ShieldCheck, Key, Briefcase } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

interface ColaboradorGeralTabProps {
  employee: Employee
}

export function ColaboradorGeralTab({ employee }: ColaboradorGeralTabProps) {
  const { projects } = useAppStore()

  const address =
    [
      employee.street,
      employee.number,
      employee.neighborhood,
      employee.city && employee.state
        ? `${employee.city} - ${employee.state}`
        : employee.city || employee.state,
    ]
      .filter(Boolean)
      .join(', ') || 'Endereço não informado'

  const currentProject = projects.find(p => p.id === employee.producaoObraId)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Basic Info Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow label="Nome" value={employee.name} icon={User} />
          <Separator />
          <DetailRow label="CPF" value={employee.cpf} icon={FileText} />
          <Separator />
          <DetailRow label="Endereço" value={address} icon={MapPin} />
          <Separator />
          <DetailRow label="Obra Atual" value={currentProject ? currentProject.name : 'Nenhuma'} icon={Briefcase} />
          <Separator />
          <DetailRow label="Status" icon={Activity}>
            <span className="capitalize font-bold text-foreground">
              {employee.status}
            </span>
          </DetailRow>
        </CardContent>
      </Card>

      {/* Important Dates Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Datas Importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailRow label="Data de Admissão" icon={Calendar}>
            <div className="flex items-center gap-2 justify-end">
              {safeFormat(employee.admissionDate, 'dd/MM/yyyy')}
            </div>
          </DetailRow>
          <Separator />
          <DetailRow label="Vencimento das Férias" icon={Calendar}>
            <div className="flex items-center gap-2 justify-end">
              {safeFormat(employee.vacationDueDate, 'dd/MM/yyyy')}
            </div>
          </DetailRow>
        </CardContent>
      </Card>

      {/* Digital Wallet Card */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-orange-600" />
            Acesso Carteira Digital
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <DetailRow
            label="Login / Usuário"
            value={employee.carteira_digital_login || 'Não informado'}
            icon={User}
          />
          <DetailRow
            label="Senha"
            value={employee.carteira_digital_senha ? '********' : 'Não informada'}
            icon={Key}
          />
        </CardContent>
      </Card>

      {(employee.observacoes_periodo || employee.historico_colaborador) && (
        <div className="md:col-span-2 space-y-6">
          {employee.observacoes_periodo && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Períodos de Trabalho (Adicionais)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {employee.observacoes_periodo}
                </p>
              </CardContent>
            </Card>
          )}

          {employee.historico_colaborador && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Histórico do Colaborador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {employee.historico_colaborador}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
