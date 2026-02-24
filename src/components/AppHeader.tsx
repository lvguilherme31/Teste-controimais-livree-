import { Bell, Search, User, FileWarning, LogOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/stores/useAppStore'
import { useAuth } from '@/context'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { getAlertStatus } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { format } from 'date-fns'

export function AppHeader() {
  const { bills, expiringDocuments } = useAppStore()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  // Calculate generic alert count for badge (Expired or Urgent)
  const urgentBills = bills
    .filter((b) => b.status === 'pending' || b.status === 'overdue')
    .filter((b) => {
      const status = getAlertStatus(new Date(b.dueDate))
      return status.severity === 'expired' || status.severity === 'urgent'
    })

  const alertCount = urgentBills.length + expiringDocuments.length

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b bg-background px-6 shadow-sm">
      <SidebarTrigger />
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-sm hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Pesquisar..." className="pl-9" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group">
              <Bell
                className={
                  alertCount > 0
                    ? 'h-5 w-5 animate-[swing_1s_ease-in-out_infinite]'
                    : 'h-5 w-5'
                }
              />
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 font-semibold border-b">Notificações</div>
            <div className="max-h-[300px] overflow-y-auto">
              {alertCount === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação pendente.
                </div>
              ) : (
                <div className="divide-y">
                  {expiringDocuments.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="p-3 hover:bg-muted/50 transition-colors cursor-pointer text-sm"
                      onClick={() => navigate(`/obras/${doc.obra_id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <FileWarning className="h-5 w-5 text-orange-500 mt-0.5" />
                        <div>
                          <p className="font-medium">
                            {doc.tipo?.toUpperCase() || 'DOCUMENTO'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Obra: {doc.obra?.nome}
                          </p>
                          <p className="text-xs text-red-500 font-medium">
                            Vence em:{' '}
                            {format(new Date(doc.data_validade), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {urgentBills.map((bill) => (
                    <div
                      key={bill.id}
                      className="p-3 hover:bg-muted/50 transition-colors cursor-pointer text-sm"
                      onClick={() => navigate('/financeiro')}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-red-500 font-bold">R$</span>
                        <div>
                          <p className="font-medium">{bill.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Vencimento:{' '}
                            {format(new Date(bill.dueDate), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Menu do usuário</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
              Perfil & Segurança
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
