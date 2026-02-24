import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  DollarSign,
  Users,
  HardHat,
  Truck,
  FileText,
  Calculator,
  Settings,
  LogOut,
  Building2,
  Home,
  Contact,
  Wrench,
  Banknote,
} from 'lucide-react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/stores/useAppStore'
import { useAuth } from '@/context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAppStore()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  // Permissions check helper
  const canAccess = (key: string) => {
    if (!currentUser) return false
    return (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin' ||
      (currentUser.permissions as any)?.[key] === true
    )
  }

  const mainNav = [
    {
      title: 'Dashboard',
      url: '/',
      icon: LayoutDashboard,
      access: 'dashboard',
    },
  ]

  const managementNav = [
    {
      title: 'Obras e Projetos',
      url: '/obras',
      icon: HardHat,
      access: 'obras',
    },
    {
      title: 'Colaboradores',
      url: '/colaboradores',
      icon: Users,
      access: 'colaboradores',
    },
    {
      title: 'Alojamentos',
      url: '/alojamentos',
      icon: Home,
      access: 'alojamento',
    },
    {
      title: 'Frota e Veículos',
      url: '/veiculos',
      icon: Truck,
      access: 'veiculos',
    },
    {
      title: 'Fichário de Funções',
      url: '/prestadores',
      icon: Contact,
      access: 'fichario_funcoes',
    },
    {
      title: 'Ferramentas',
      url: '/ferramentas',
      icon: Wrench,
      access: 'ferramentas',
    },
  ]

  const financeNav = [
    {
      title: 'Contas a Pagar',
      url: '/financeiro',
      icon: DollarSign,
      access: 'contas_pagar',
    },
    {
      title: 'Pagamento de Funcionários',
      url: '/financeiro/pagamentos',
      icon: Banknote,
      access: 'pagamento_colaboradores',
    },
    {
      title: 'Nota Fiscal',
      url: '/notas-fiscais',
      icon: FileText,
      access: 'notas_fiscais',
    },
    {
      title: 'Aluguel de Equipamentos',
      url: '/alugueis',
      icon: HardHat,
      access: 'aluguel_equipamentos',
    },
    {
      title: 'Orçamentos',
      url: '/orcamentos',
      icon: Calculator,
      access: 'orcamentos',
    },
  ]

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="bg-sidebar py-4">
        <div className="flex items-center gap-2 px-2 overflow-hidden transition-all duration-300 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
            Constroimais
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav
                .filter((i) => canAccess(i.access as any))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            Gestão Operacional
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNav
                .filter((i) => canAccess(i.access as any))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.url)}
                      tooltip={item.title}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">
            Financeiro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeNav
                .filter((i) => canAccess(i.access as any))
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.url === '/financeiro' ? pathname === item.url : pathname.startsWith(item.url)}
                      tooltip={item.title}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar text-sidebar-foreground">
        <SidebarMenu>
          {canAccess('configuracoes') && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Configurações"
                isActive={pathname === '/configuracoes'}
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Link to="/configuracoes">
                  <Settings />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sair"
              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-red-400 hover:text-red-400"
            >
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
