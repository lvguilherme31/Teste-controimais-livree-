import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { format } from 'date-fns'
import {
  User,
  Bill,
  Employee,
  Project,
  Vehicle,
  Invoice,
  Budget,
  Accommodation,
  ProjectHistory,
  ServiceProvider,
  Tool,
  AluguelEquipamento,
  EmployeePayment,
  Payslip,
  UserInvite,
} from '@/types'
import { obrasService } from '@/services/obrasService'
import { veiculosService } from '@/services/veiculosService'
import { alojamentosService } from '@/services/alojamentosService'
import { prestadoresService } from '@/services/prestadoresService'
import { colaboradoresService } from '@/services/colaboradoresService'
import { notasService } from '@/services/notasService'
import { orcamentosService } from '@/services/orcamentosService'
import { financeiroService } from '@/services/financeiroService'
import { ferramentasService } from '@/services/ferramentasService'
import { aluguelService } from '@/services/aluguelService'
import { pagamentosService } from '@/services/pagamentosService'
import { usersService } from '@/services/usersService'
import { supabase } from '@/lib/supabase/client'

const GUEST_USER: User = {
  id: 'guest-user',
  name: 'Visitante',
  email: 'visitante@aparecidacortez.com.br',
  role: 'super_admin',
  companyName: 'Aparecida Cortez Lopes - Construção',
  cnpj: '23.497.744/0001-69',
  phone: '(11) 99999-9999',
  permissions: {
    dashboard: true,
    obras: true,
    colaboradores: true,
    alojamento: true,
    veiculos: true,
    fichario_funcoes: true,
    ferramentas: true,
    financeiro: true,
    contas_pagar: true,
    pagamento_colaboradores: true,
    notas_fiscais: true,
    aluguel_equipamentos: true,
    orcamentos: true,
    configuracoes: true,
  },
}

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Luis Guilherme',
    email: 'luisguilhermevsc@gmail.com',
    role: 'super_admin',
    companyName: 'Aparecida Cortez Lopes - Construção',
    cnpj: '23.497.744/0001-69',
    phone: '(11) 99999-9999',
    permissions: {
      dashboard: true,
      obras: true,
      colaboradores: true,
      alojamento: true,
      veiculos: true,
      fichario_funcoes: true,
      ferramentas: true,
      financeiro: true,
      contas_pagar: true,
      pagamento_colaboradores: true,
      notas_fiscais: true,
      aluguel_equipamentos: true,
      orcamentos: true,
      configuracoes: true,
    },
  },
  {
    id: '2',
    name: 'Murilo Topazio Prudente',
    email: 'murilotopazioprudente@gmail.com',
    role: 'admin',
    companyName: 'Aparecida Cortez Lopes - Construção',
    cnpj: '23.497.744/0001-69',
    phone: '(11) 98888-8888',
    permissions: {
      dashboard: true,
      obras: true,
      colaboradores: true,
      alojamento: true,
      veiculos: true,
      fichario_funcoes: true,
      ferramentas: true,
      financeiro: true,
      contas_pagar: true,
      pagamento_colaboradores: true,
      notas_fiscais: true,
      aluguel_equipamentos: true,
      orcamentos: true,
      configuracoes: true,
    },
  },
  {
    id: '3',
    name: 'Fabio Topazio Prudente',
    email: 'fabiotopazioprudente@gmail.com',
    role: 'admin',
    companyName: 'Aparecida Cortez Lopes - Construção',
    cnpj: '23.497.744/0001-69',
    phone: '(11) 97777-7777',
    permissions: {
      dashboard: true,
      obras: true,
      colaboradores: true,
      alojamento: true,
      veiculos: true,
      fichario_funcoes: true,
      ferramentas: true,
      financeiro: true,
      contas_pagar: true,
      pagamento_colaboradores: true,
      notas_fiscais: true,
      aluguel_equipamentos: true,
      orcamentos: true,
      configuracoes: true,
    },
  },
]

interface AppState {
  isAuthenticated: boolean
  isInitializing: boolean
  currentUser: User | null
  users: User[]
  invites: UserInvite[]
  bills: Bill[]
  employees: Employee[]
  accommodations: Accommodation[]
  serviceProviders: ServiceProvider[]
  vehicles: Vehicle[]
  invoices: Invoice[]
  budgets: Budget[]
  projects: Project[]
  tools: Tool[]
  rentals: AluguelEquipamento[]
  loadingProjects: boolean
  loadingTools: boolean
  expiringDocuments: any[]
  employeePayments: EmployeePayment[]
  generateMonthlyObligations: () => Promise<void>

  // Actions
  login: (email: string) => void
  logout: () => void
  setCurrentUser: (user: User | null) => void
  setIsAuthenticated: (val: boolean) => void
  setIsInitializing: (val: boolean) => void
  updateCurrentUser: (updates: Partial<User>) => void
  setUsers: (users: User[]) => void
  addUser: (user: User) => void
  deleteUser: (userId: string) => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => void

  fetchUsers: () => Promise<void>
  fetchInvites: () => Promise<void>
  sendInvite: (invite: UserInvite) => Promise<void>
  removeInvite: (email: string) => Promise<void>

  fetchBills: () => Promise<void>
  addBill: (bill: Bill) => Promise<void>
  updateBill: (id: string, updates: Partial<Bill>) => Promise<void>
  deleteBill: (id: string) => Promise<void>

  fetchEmployees: () => Promise<void>
  addEmployee: (employee: Employee) => Promise<Employee>
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>

  fetchProjects: () => Promise<void>
  addProject: (project: Partial<Project>, files: any) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>, files: any) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  getProjectHistory: (id: string) => Promise<ProjectHistory[]>

  fetchVehicles: () => Promise<void>
  addVehicle: (vehicle: Vehicle) => Promise<Vehicle>
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void
  deleteVehicle: (id: string) => Promise<void>

  fetchInvoices: () => Promise<void>
  addInvoice: (invoice: Invoice) => Promise<void>
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>
  deleteInvoice: (id: string) => Promise<void>

  fetchBudgets: () => Promise<void>
  addBudget: (budget: Budget, files: File[]) => Promise<void>
  updateBudget: (id: string, updates: Partial<Budget>, files: File[]) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  deleteBudgetAttachment: (id: string) => Promise<void>

  fetchAccommodations: () => Promise<void>
  addAccommodation: (accommodation: Accommodation) => Promise<void>
  updateAccommodation: (id: string, updates: Partial<Accommodation>) => Promise<void>
  deleteAccommodation: (id: string) => Promise<void>

  fetchServiceProviders: () => Promise<void>
  addServiceProvider: (provider: Omit<ServiceProvider, 'id' | 'created_at'>) => Promise<void>
  updateServiceProvider: (id: string, updates: Partial<ServiceProvider>) => Promise<void>
  deleteServiceProvider: (id: string) => Promise<void>

  fetchTools: () => Promise<void>
  addTool: (tool: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTool: (id: string, tool: Partial<Tool>) => Promise<void>
  deleteTool: (id: string) => Promise<void>

  fetchRentals: () => Promise<void>
  addRental: (rental: Omit<AluguelEquipamento, 'id' | 'createdAt'>) => Promise<void>
  updateRental: (id: string, updates: Partial<AluguelEquipamento>) => Promise<void>
  deleteRental: (id: string) => Promise<void>

  fetchExpiringDocuments: () => Promise<void>

  fetchEmployeesPayments: () => Promise<void>
  addEmployeePayment: (payment: Omit<EmployeePayment, 'id'>) => Promise<void>
  updateEmployeePayment: (id: string, updates: Partial<EmployeePayment>) => Promise<void>
  deleteEmployeePayment: (id: string) => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isInitializing: true,
      currentUser: null,
      users: [],
      invites: [],
      bills: [],
      employees: [],
      accommodations: [],
      serviceProviders: [],
      vehicles: [],
      invoices: [],
      budgets: [],
      projects: [],
      tools: [],
      rentals: [],
      loadingProjects: false,
      loadingTools: false,
      expiringDocuments: [],
      employeePayments: [],

      setCurrentUser: (user) => set({ currentUser: user }),
      setIsAuthenticated: (val) => set({ isAuthenticated: val }),
      setIsInitializing: (val) => set({ isInitializing: val }),
      setUsers: (users) => set({ users }),

      login: async (email) => {
        set({ isAuthenticated: true })
        try {
          // Fetch real user from DB
          const user = await usersService.getByEmail(email)
          if (user) {
            set({ currentUser: user })
          } else {
            // Check if it's the specific guest email OR the primary owner
            const isOwner = ['luisguilhermevsc@gmail.com', 'luisguilhermevsc@me.com', 'murilotopazioprudente@gmail.com'].includes(email);

            if (email === GUEST_USER.email || isOwner) {
              set({ currentUser: { ...GUEST_USER, email } })
            } else {
              // Only revoke access for secondary users not in DB
              console.warn(`User ${email} not found in DB. Revoking access.`)
              get().logout()
            }
          }
        } catch (error) {
          console.error('Error logging in:', error)
          // On error, let's be safe and logout
          get().logout()
        } finally {
          set({ isInitializing: false })
        }
        get().fetchProjects()
      },

      logout: () => {
        supabase.auth.signOut()
        set({ currentUser: null, isAuthenticated: false, isInitializing: false })
      },

      updateCurrentUser: (updates) => {
        const { currentUser, users } = get()
        if (!currentUser) return
        const updatedUser = { ...currentUser, ...updates }
        set({
          currentUser: updatedUser,
          users: users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
        })
      },

      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      deleteUser: async (userId) => {
        try {
          await usersService.delete(userId)
          set((state) => ({ users: state.users.filter((u) => u.id !== userId) }))
        } catch (error) {
          console.error('Error deleting user:', error)
          throw error
        }
      },
      updateUser: (id, updates) => set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u))
      })),

      fetchUsers: async () => {
        try {
          const data = await usersService.getAll()
          set({ users: data || [] })

          // Also update currentUser if it's already set (to sync permissions/role)
          const { currentUser } = get()
          if (currentUser?.email) {
            const updatedProfile = data.find(u => u.email === currentUser.email)
            if (updatedProfile) {
              set({ currentUser: updatedProfile })
            }
          }
        } catch (error) {
          console.error('Error fetching users:', error)
        }
      },

      fetchInvites: async () => {
        try {
          const data = await usersService.getInvites()
          set({ invites: data || [] })
        } catch (error) {
          console.error('Error fetching invites:', error)
        }
      },

      sendInvite: async (invite) => {
        await usersService.createInvite(invite)
        await get().fetchInvites()
      },

      removeInvite: async (email) => {
        await usersService.deleteInvite(email)
        await get().fetchInvites()
      },

      fetchBills: async () => {
        try {
          const data = await financeiroService.getAll()
          set({ bills: data || [] })
        } catch (error) {
          console.error('Error fetching bills:', error)
        }
      },

      addBill: async (bill) => {
        await financeiroService.create(bill)
        await get().fetchBills()
      },

      updateBill: async (id, updates) => {
        await financeiroService.update(id, updates)
        await get().fetchBills()
      },

      deleteBill: async (id) => {
        await financeiroService.delete(id)
        await get().fetchBills()
      },

      fetchEmployees: async () => {
        try {
          const data = await colaboradoresService.getAll()
          set({ employees: data || [] })
        } catch (error) {
          console.error('Error fetching employees:', error)
        }
      },

      addEmployee: async (employee) => {
        const newEmp = await colaboradoresService.create(employee)
        set((state) => ({ employees: [...state.employees, newEmp] }))
        await get().fetchEmployees()
        return newEmp
      },

      updateEmployee: async (id, updates) => {
        await colaboradoresService.update(id, updates)
        set((state) => ({
          employees: state.employees.map((e) => (e.id === id ? { ...e, ...updates } : e))
        }))
        await get().fetchEmployees()
        get().fetchExpiringDocuments()
      },

      deleteEmployee: async (id) => {
        await colaboradoresService.delete(id)
        set((state) => ({
          employees: state.employees.filter((e) => e.id !== id)
        }))
        get().fetchExpiringDocuments()
      },

      fetchProjects: async () => {
        set({ loadingProjects: true })
        try {
          const data = await obrasService.getAll()
          set({ projects: data || [] })
        } catch (error) {
          console.error('Error fetching projects:', error)
        } finally {
          set({ loadingProjects: false })
        }
      },

      addProject: async (project, files) => {
        await obrasService.create(project as Project, files)
        await get().fetchProjects()
        await get().fetchExpiringDocuments()
      },

      updateProject: async (id, updates, files) => {
        await obrasService.update(id, updates, files)
        await get().fetchProjects()
        await get().fetchExpiringDocuments()
      },

      deleteProject: async (id) => {
        await obrasService.delete(id)
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id)
        }))
        await get().fetchExpiringDocuments()
      },

      getProjectHistory: async (id) => {
        return await obrasService.getHistory(id)
      },

      fetchVehicles: async () => {
        try {
          const data = await veiculosService.getAll()
          set({ vehicles: data || [] })
        } catch (error) {
          console.error('Error fetching vehicles:', error)
        }
      },

      addVehicle: async (vehicle) => {
        const newVehicle = await veiculosService.create(vehicle)
        set((state) => ({ vehicles: [...state.vehicles, newVehicle] }))
        get().fetchExpiringDocuments()
        return newVehicle
      },

      updateVehicle: (id, updates) => {
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v))
        }))
      },

      deleteVehicle: async (id) => {
        await veiculosService.delete(id)
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id)
        }))
        get().fetchExpiringDocuments()
      },

      fetchInvoices: async () => {
        try {
          const data = await notasService.getAll()
          set({ invoices: data || [] })
        } catch (error) {
          console.error('Error fetching invoices:', error)
        }
      },

      addInvoice: async (invoice) => {
        await notasService.create(invoice)
        await get().fetchInvoices()
      },

      updateInvoice: async (id, updates) => {
        await notasService.update(id, updates)
        await get().fetchInvoices()
      },

      deleteInvoice: async (id) => {
        await notasService.delete(id)
        set((state) => ({
          invoices: state.invoices.filter((inv) => inv.id !== id)
        }))
      },

      fetchBudgets: async () => {
        try {
          const data = await orcamentosService.getAll()
          set({ budgets: data || [] })
        } catch (error) {
          console.error('Error fetching budgets:', error)
        }
      },

      addBudget: async (budget, files) => {
        await orcamentosService.create(budget, files)
        await get().fetchBudgets()
      },

      updateBudget: async (id, updates, files) => {
        await orcamentosService.update(id, updates, files)
        await get().fetchBudgets()
      },

      deleteBudget: async (id) => {
        await orcamentosService.delete(id)
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id)
        }))
      },

      deleteBudgetAttachment: async (id) => {
        await orcamentosService.deleteAttachment(id)
        await get().fetchBudgets()
      },

      fetchAccommodations: async () => {
        try {
          const data = await alojamentosService.getAll()
          set({ accommodations: data || [] })
        } catch (error) {
          console.error('Error fetching accommodations:', error)
        }
      },

      addAccommodation: async (accommodation) => {
        // Just add to local state; the creation in DB is handled by the component
        set((state) => ({ accommodations: [...state.accommodations, accommodation] }))
      },

      updateAccommodation: async (id, updates) => {
        await alojamentosService.update(id, updates)
        set((state) => ({
          accommodations: state.accommodations.map((a) => (a.id === id ? { ...a, ...updates } : a))
        }))
      },

      deleteAccommodation: async (id) => {
        await alojamentosService.delete(id)
        set((state) => ({
          accommodations: state.accommodations.filter((a) => a.id !== id)
        }))
      },

      fetchExpiringDocuments: async () => {
        try {
          const [obrasDocs, collabDocs, veiculosDocs] = await Promise.all([
            obrasService.getExpiringDocs(),
            colaboradoresService.getExpiringDocs(),
            veiculosService.getExpiringDocs(),
          ])

          const normalizedObras = obrasDocs.map((d: any) => ({
            ...d,
            category: 'Obra',
            entityName: d.obra?.nome || 'Obra Desconhecida',
            path: `/obras/${d.obra_id}`,
          }))

          const normalizedCollab = collabDocs.map((d: any) => ({
            ...d,
            category: 'Colaborador',
            entityName: d.colaborador?.nome || 'Colaborador',
            path: `/colaboradores/${d.colaborador_id}`,
          }))

          const normalizedVeiculos = veiculosDocs.map((d: any) => ({
            ...d,
            category: 'Veículo',
            entityName: d.veiculo
              ? `${d.veiculo.modelo} - ${d.veiculo.placa}`
              : 'Veículo',
            path: `/veiculos`,
          }))

          const all = [...normalizedObras, ...normalizedCollab, ...normalizedVeiculos].sort(
            (a, b) => new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime(),
          )

          set({ expiringDocuments: all })
        } catch (error) {
          console.error('Error fetching expiring docs:', error)
        }
      },

      fetchServiceProviders: async () => {
        try {
          const data = await prestadoresService.getAll()
          set({ serviceProviders: data || [] })
        } catch (error) {
          console.error('Error fetching service providers:', error)
        }
      },

      addServiceProvider: async (provider) => {
        await prestadoresService.create(provider)
        await get().fetchServiceProviders()
      },

      updateServiceProvider: async (id, updates) => {
        await prestadoresService.update(id, updates)
        await get().fetchServiceProviders()
      },

      deleteServiceProvider: async (id) => {
        await prestadoresService.delete(id)
        await get().fetchServiceProviders()
      },

      fetchTools: async () => {
        set({ loadingTools: true })
        try {
          const data = await ferramentasService.getAll()
          set({ tools: data || [] })
        } catch (error) {
          console.error('Error fetching tools:', error)
        } finally {
          set({ loadingTools: false })
        }
      },

      addTool: async (tool) => {
        await ferramentasService.create(tool)
        await get().fetchTools()
      },

      updateTool: async (id, tool) => {
        await ferramentasService.update(id, tool)
        await get().fetchTools()
      },

      deleteTool: async (id) => {
        await ferramentasService.delete(id)
        await get().fetchTools()
      },

      fetchRentals: async () => {
        try {
          const data = await aluguelService.getAll()
          set({ rentals: data || [] })
        } catch (error) {
          console.error('Error fetching rentals:', error)
        }
      },

      addRental: async (rental) => {
        await aluguelService.create(rental)
        await get().fetchRentals()
        await get().fetchBills() // Refresh bills as rental creates a bill
      },

      updateRental: async (id, updates) => {
        await aluguelService.update(id, updates)
        await get().fetchRentals()
        await get().fetchBills()
      },

      deleteRental: async (id) => {
        await aluguelService.delete(id)
        await get().fetchRentals()
        await get().fetchBills()
      },

      fetchEmployeesPayments: async () => {
        try {
          const data = await pagamentosService.getAll()
          set({ employeePayments: data || [] })

          // Automatically check and generate monthly obligations for active employees
          await get().generateMonthlyObligations()
        } catch (error) {
          console.error('Error fetching employee payments:', error)
        }
      },

      generateMonthlyObligations: async () => {
        const currentMonth = format(new Date(), 'yyyy-MM')
        const { employees, employeePayments } = get()

        const activeEmployees = employees.filter(e => e.status === 'ativo')

        // Find employees who don't have a payment record for the current month
        const missingObligations = activeEmployees.filter(emp =>
          !employeePayments.some(p => p.colaboradorId === emp.id && p.mesReferencia === currentMonth)
        )

        if (missingObligations.length === 0) return

        console.log(`Generating auto-obligations for ${missingObligations.length} employees for ${currentMonth}`)

        for (const emp of missingObligations) {
          try {
            // Replicate the logic from addEmployeePayment but without the fetch at the end
            const payment = {
              colaboradorId: emp.id,
              mesReferencia: currentMonth,
              valorAPagar: emp.tipoRemuneracao === 'production' ? (emp.producaoValorTotal || 0) : (emp.salary || 0),
              status: 'pendente' as const,
            }

            const created = await pagamentosService.create(payment)
          } catch (error) {
            console.error(`Failed to generate obligation for employee ${emp.id}:`, error)
          }
        }

        // Refresh once after batch creation
        const updatedData = await pagamentosService.getAll()
        set({ employeePayments: updatedData || [] })
      },

      addEmployeePayment: async (payment) => {
        await pagamentosService.create(payment)
        await get().fetchEmployeesPayments()
      },

      updateEmployeePayment: async (id, updates) => {
        await pagamentosService.update(id, updates)
        await get().fetchEmployeesPayments()
      },

      deleteEmployeePayment: async (id) => {
        await pagamentosService.delete(id)
        await get().fetchEmployeesPayments()
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !['isInitializing'].includes(key)
          )
        ) as AppState,
    }
  )
)

// AppProvider component to handle initialization
import React, { useEffect } from 'react'
import { useAuth } from '@/context'

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const store = useAppStore()
  const { user: authUser } = useAuth()

  useEffect(() => {
    store.fetchProjects()
    store.fetchExpiringDocuments()
    store.fetchVehicles()
    store.fetchAccommodations()
    store.fetchEmployees()
    store.fetchInvoices()
    store.fetchBudgets()
    store.fetchBills()
    store.fetchTools()
    store.fetchRentals()
    store.fetchEmployeesPayments()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        store.setIsAuthenticated(true)
        // store.login(session.user.email) will be handled by the second useEffect

        // Initial fetch on login
        store.fetchProjects()
        store.fetchEmployees()
        store.fetchVehicles()
        store.fetchAccommodations()
        store.fetchBills()
        store.fetchInvoices()
        store.fetchBudgets()
        store.fetchExpiringDocuments()
        store.fetchServiceProviders()
        store.fetchTools()
        store.fetchRentals()
        store.fetchEmployeesPayments()
        store.fetchUsers()
        store.fetchInvites()
      } else {
        store.setIsAuthenticated(false)
        store.setCurrentUser(null)
        store.setIsInitializing(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sync currentUser with authUser email
  useEffect(() => {
    // We only trigger login if we have an authUser email and it differs from current state
    if (authUser?.email && store.currentUser?.email !== authUser.email) {
      store.login(authUser.email);
    } else if (!authUser) {
      // If no auth user, ensure initializing is false
      if (store.isInitializing) store.setIsInitializing(false);
    } else if (authUser?.email && store.currentUser?.email === authUser.email) {
      // If sync is done, stop initializing
      if (store.isInitializing) store.setIsInitializing(false);
    }
  }, [authUser?.email, store.currentUser?.email])

  return <>{children}</>
}
