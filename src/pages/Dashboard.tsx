import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/stores/useAppStore'
import {
  Users,
  HardHat,
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  Bell,
  Truck,
  Building2,
  AlertCircle,
  Home,
} from 'lucide-react'
import { format, addDays, isBefore, differenceInDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn, getAlertStatus } from '@/lib/utils'

export default function Dashboard() {
  const { projects, employees, bills, expiringDocuments, accommodations, rentals } = useAppStore()
  const navigate = useNavigate()
  const today = new Date()

  // KPI 1: Active Works
  const activeProjects = projects.filter((p) => p.status === 'ativa').length

  // KPI 2: Team in Field (Updated to use 'ativo' status)
  const activeEmployees = employees.filter((e) => e.status === 'ativo').length

  // KPI 3: Active Accommodations
  const activeAccommodations = accommodations.filter((a) => a.status === 'active').length



  // KPI 3: Bills to Pay (Next 7 days)
  const nextWeek = addDays(today, 7)
  const billsNextWeek = bills
    .filter(
      (b) =>
        (b.status === 'pending' || b.status === 'overdue') &&
        isBefore(new Date(b.dueDate), nextWeek),
    )
    .reduce((acc, curr) => acc + curr.amount, 0)

  // Generate Alerts List
  const generateAlerts = () => {
    let allAlerts: any[] = []

    // 1. Unified Document Alerts (from store aggregation)
    expiringDocuments.forEach((doc) => {
      const date = new Date(doc.data_validade)
      const status = getAlertStatus(date)

      // Determine Icon based on category
      let icon = FileText
      if (doc.category === 'Obra') icon = Building2
      if (doc.category === 'Colaborador') icon = Users
      if (doc.category === 'Veículo') icon = Truck

      allAlerts.push({
        type: `${doc.category} / ${doc.tipo?.toUpperCase() || 'DOC'}`,
        message: `${doc.entityName}`,
        date: date,
        status: status,
        path: doc.path,
        icon: icon,
        source: 'doc',
        category: doc.category,
      })
    })

    // 2. Bill Alerts (Financial)
    bills.forEach((b) => {
      if (b.status === 'pending' || b.status === 'overdue') {
        const date = new Date(b.dueDate)
        const status = getAlertStatus(date)
        const isRental = b.category === 'Aluguel de Equipamentos' || !!b.aluguel_id

        allAlerts.push({
          type: isRental ? 'Aluguel' : 'Financeiro',
          message: `${b.description}`,
          date: date,
          status: status,
          path: isRental ? '/alugueis' : '/financeiro',
          icon: isRental ? HardHat : DollarSign,
          source: 'bill',
          category: 'Financeiro',
        })
      }
    })

    // 3. Vacation Alerts (Employees)
    employees.forEach((e) => {
      if (e.status === 'ativo' && e.vacationDueDate) {
        const date = new Date(e.vacationDueDate)
        const status = getAlertStatus(date)

        allAlerts.push({
          type: 'Férias',
          message: `${e.name}`,
          date: date,
          status: status,
          path: '/colaboradores',
          icon: Users,
          source: 'vacation',
          category: 'Colaborador',
        })
      }
    })

    // 4. Rental Alerts (Removed - now handled by finance alerts to avoid duplication)



    // Sort by severity (Expired -> Urgent -> Attention -> Warning) and then date
    const severityOrder = {
      expired: 0,
      urgent: 1,
      attention: 2,
      warning: 3,
      ok: 4,
    }

    return allAlerts.sort((a, b) => {
      const sevDiff =
        severityOrder[a.status.severity as keyof typeof severityOrder] -
        severityOrder[b.status.severity as keyof typeof severityOrder]
      if (sevDiff !== 0) return sevDiff
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  }

  const alerts = generateAlerts()
  // Global Alert Count: Includes all pending/expired alerts across works and collaborators
  const urgentCount = alerts.filter((a) => a.status.severity !== 'ok').length

  const obraAlerts = alerts.filter(
    (a) => (a.category === 'Obra' || a.category === 'Veículo') && a.status.severity !== 'ok',
  )
  const colabAlerts = alerts.filter((a) => a.category === 'Colaborador')
  const billAlerts = alerts.filter(
    (a) => a.category === 'Financeiro' && a.status.severity !== 'ok',
  )


  const getDeadlineText = (date: Date, severity: string) => {
    const diff = differenceInDays(date, new Date())
    if (severity === 'expired') return `Vencido há ${Math.abs(diff)} dias`
    if (severity === 'ok' && diff > 0) return `Faltam ${diff} dias`
    if (severity === 'warning' || severity === 'attention' || severity === 'urgent')
      return `Faltam ${diff} dias`
    return format(date, 'dd/MM/yyyy')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Painel de Controle
          </h1>
          <p className="text-muted-foreground">
            Visão geral inteligente e alertas de vencimento
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-md shadow-sm text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Atualizado: {format(new Date(), 'HH:mm')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="flex justify-center text-center">
        <div className="grid gap-4 md:grid-cols-4 max-w-6xl w-full">
          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2 flex-col">
                <div className="p-2 bg-primary/10 rounded-full">
                  <HardHat className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{activeProjects}</div>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Obras Ativas
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2 flex-col">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{activeEmployees}</div>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Colaboradores Ativos
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2 flex-col">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <Home className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{activeAccommodations}</div>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Alojamentos Ativos
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-t-4 border-t-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2 flex-col">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">
                  R${' '}
                  {billsNextWeek.toLocaleString('pt-BR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                  Boletos a vencer
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ALERT SECTIONS GRID */}
      <div className="grid gap-8 grid-cols-1 xl:grid-cols-3">
        {/* SECTION 1: Works Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Alertas de Obras
            </h2>
          </div>

          <div className="space-y-3">
            {obraAlerts.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm text-center border border-dashed">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-green-50 rounded-full">
                    <AlertCircle className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  Tudo em dia!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhuma pendência encontrada para obras.
                </p>
              </div>
            ) : (
              obraAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(alert.path)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border shadow-sm cursor-pointer transition-all hover:scale-[1.01]',
                    alert.status.bg,
                    alert.status.border,
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'p-2 rounded-full bg-white/80',
                        alert.status.color,
                      )}
                    >
                      <alert.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4
                        className={cn(
                          'font-bold text-sm',
                          alert.status.color,
                        )}
                      >
                        {alert.message}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-0.5">
                        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-75">
                          {alert.type}
                        </span>
                        <span className="text-[10px] opacity-50">•</span>
                        <span className="text-[10px] md:text-xs opacity-75">
                          {getDeadlineText(alert.date, alert.status.severity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      className={cn(
                        'uppercase text-[10px] font-bold border-none bg-white/50 hover:bg-white',
                        alert.status.color,
                      )}
                    >
                      {alert.status.label}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 2: Collaborator Alerts (The new requested section) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" /> Alertas Colaboradores
            </h2>
          </div>

          <div className="space-y-3">
            {colabAlerts.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm text-center border border-dashed">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-green-50 rounded-full">
                    <AlertCircle className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  Tudo em dia!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhuma pendência de colaborador.
                </p>
              </div>
            ) : (
              colabAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(alert.path)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border shadow-sm cursor-pointer transition-all hover:scale-[1.01]',
                    alert.status.bg,
                    alert.status.border,
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'p-2 rounded-full bg-white/80',
                        alert.status.color,
                      )}
                    >
                      <alert.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4
                        className={cn(
                          'font-bold text-sm',
                          alert.status.color,
                        )}
                      >
                        {alert.message}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-0.5">
                        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-75">
                          {alert.type}
                        </span>
                        <span className="text-[10px] opacity-50">•</span>
                        <span className="text-[10px] md:text-xs opacity-75">
                          {getDeadlineText(alert.date, alert.status.severity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      className={cn(
                        'uppercase text-[10px] font-bold border-none bg-white/50 hover:bg-white',
                        alert.status.color,
                      )}
                    >
                      {alert.status.label}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 3: Bill Alerts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" /> Alertas de Contas
            </h2>
          </div>

          <div className="space-y-3">
            {billAlerts.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-sm text-center border border-dashed">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-green-50 rounded-full">
                    <AlertCircle className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-900">
                  Tudo em dia!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Nenhuma conta pendente.
                </p>
              </div>
            ) : (
              billAlerts.slice(0, 10).map((alert, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(alert.path)}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border shadow-sm cursor-pointer transition-all hover:scale-[1.01]',
                    alert.status.bg,
                    alert.status.border,
                    alert.status.color,
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'p-2 rounded-full bg-white/80',
                        alert.status.color,
                      )}
                    >
                      <alert.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4
                        className={cn(
                          'font-bold text-sm',
                          alert.status.color,
                        )}
                      >
                        {alert.message}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-0.5">
                        <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider opacity-75">
                          {alert.type}
                        </span>
                        <span className="text-[10px] opacity-50">•</span>
                        <span className="text-[10px] md:text-xs opacity-75">
                          {getDeadlineText(alert.date, alert.status.severity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      className={cn(
                        'uppercase text-[10px] font-bold border-none bg-white/50 hover:bg-white',
                        alert.status.color,
                      )}
                    >
                      {alert.status.label}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
