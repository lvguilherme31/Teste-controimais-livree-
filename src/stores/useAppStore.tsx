import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase/client'
import {
  Bill,
  Employee,
  Project,
  User,
  UserInvite,
  Accommodation,
  Vehicle,
  Invoice,
  Budget,
  ProjectHistory,
  ServiceProvider,
  Tool,
  AluguelEquipamento,
  EmployeePayment
} from '@/types'
import { financeiroService } from '@/services/financeiroService'
import { colaboradoresService } from '@/services/colaboradoresService'
import { obrasService } from '@/services/obrasService'
import { alojamentosService as acomodacaoService } from '@/services/alojamentosService'
import { veiculosService as veiculoService } from '@/services/veiculosService'
import { notasService as notasFiscaisService } from '@/services/notasService'
import { orcamentosService as orcamentoService } from '@/services/orcamentosService'
import { usersService as usuariosService } from '@/services/usersService'
import { prestadoresService } from '@/services/prestadoresService'
import { ferramentasService } from '@/services/ferramentasService'
import { aluguelService } from '@/services/aluguelService'
import { pagamentosService } from '@/services/pagamentosService'
import { toast } from 'sonner'

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

      login: async (email) => {
        try {
          const user = await usuariosService.getByEmail(email)
          if (user) {
            set({ currentUser: user, isAuthenticated: true })
          } else {
            set({ isAuthenticated: false, currentUser: null })
          }
        } catch (error) {
          console.error('Error in login action:', error)
          set({ isAuthenticated: false, currentUser: null })
        } finally {
          set({ isInitializing: false })
        }
      },

      logout: () => {
        set({ isAuthenticated: false, currentUser: null })
        supabase.auth.signOut()
      },

      updateCurrentUser: async (updates) => {
        const { currentUser } = get()
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates }
          set({ currentUser: updatedUser })
          await usuariosService.update(currentUser.id, updates)
        }
      },

      setUsers: (users) => set({ users }),
      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      deleteUser: async (userId) => {
        await usuariosService.delete(userId)
        set((state) => ({ users: state.users.filter((u) => u.id !== userId) }))
      },
      updateUser: (id, updates) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),

      fetchUsers: async () => {
        const users = await usuariosService.getAll()
        set({ users })
      },

      fetchInvites: async () => {
        const invites = await usuariosService.getInvites()
        set({ invites })
      },

      sendInvite: async (invite) => {
        await usuariosService.createInvite(invite)
        await get().fetchInvites()
      },

      removeInvite: async (email) => {
        await usuariosService.deleteInvite(email)
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
        const newEmployee = await colaboradoresService.create(employee)
        await get().fetchEmployees()
        return newEmployee
      },

      updateEmployee: async (id, updates) => {
        await colaboradoresService.update(id, updates)
        await get().fetchEmployees()
      },

      deleteEmployee: async (id) => {
        await colaboradoresService.delete(id)
        await get().fetchEmployees()
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
        await obrasService.create(project as any, files)
        await get().fetchProjects()
      },

      updateProject: async (id, updates, files) => {
        await obrasService.update(id, updates, files)
        await get().fetchProjects()
      },

      deleteProject: async (id) => {
        await obrasService.delete(id)
        await get().fetchProjects()
      },

      getProjectHistory: async (id) => {
        return await obrasService.getHistory(id)
      },

      fetchVehicles: async () => {
        try {
          const data = await veiculoService.getAll()
          set({ vehicles: data || [] })
        } catch (error) {
          console.error('Error fetching vehicles:', error)
        }
      },

      addVehicle: async (vehicle) => {
        const newVehicle = await veiculoService.create(vehicle)
        await get().fetchVehicles()
        return newVehicle
      },

      updateVehicle: async (id, updates) => {
        await veiculoService.update(id, updates)
        await get().fetchVehicles()
      },

      deleteVehicle: async (id) => {
        await veiculoService.delete(id)
        await get().fetchVehicles()
      },

      fetchInvoices: async () => {
        try {
          const data = await notasFiscaisService.getAll()
          set({ invoices: data || [] })
        } catch (error) {
          console.error('Error fetching invoices:', error)
        }
      },

      addInvoice: async (invoice) => {
        await notasFiscaisService.create(invoice)
        await get().fetchInvoices()
      },

      updateInvoice: async (id, updates) => {
        await notasFiscaisService.update(id, updates)
        await get().fetchInvoices()
      },

      deleteInvoice: async (id) => {
        await notasFiscaisService.delete(id)
        await get().fetchInvoices()
      },

      fetchBudgets: async () => {
        try {
          const data = await orcamentoService.getAll()
          set({ budgets: data || [] })
        } catch (error) {
          console.error('Error fetching budgets:', error)
        }
      },

      addBudget: async (budget, files) => {
        await orcamentoService.create(budget, files)
        await get().fetchBudgets()
      },

      updateBudget: async (id, updates, files) => {
        await orcamentoService.update(id, updates, files)
        await get().fetchBudgets()
      },

      deleteBudget: async (id) => {
        await orcamentoService.delete(id)
        await get().fetchBudgets()
      },

      deleteBudgetAttachment: async (id) => {
        await orcamentoService.deleteAttachment(id)
        await get().fetchBudgets()
      },

      fetchAccommodations: async () => {
        try {
          const data = await acomodacaoService.getAll()
          set({ accommodations: data || [] })
        } catch (error) {
          console.error('Error fetching accommodations:', error)
        }
      },

      addAccommodation: async (accommodation) => {
        await acomodacaoService.create(accommodation)
        await get().fetchAccommodations()
      },

      updateAccommodation: async (id, updates) => {
        await acomodacaoService.update(id, updates)
        await get().fetchAccommodations()
      },

      deleteAccommodation: async (id) => {
        await acomodacaoService.delete(id)
        await get().fetchAccommodations()
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
        await aluguelService.create(rental as any)
        await get().fetchRentals()
      },

      updateRental: async (id, updates) => {
        await aluguelService.update(id, updates)
        await get().fetchRentals()
      },

      deleteRental: async (id) => {
        await aluguelService.delete(id)
        await get().fetchRentals()
      },

      fetchExpiringDocuments: async () => {
        const { data, error } = await (supabase as any).from('documentos_expirando').select('*')

        if (error) {
          console.error('Error fetching expiring documents:', error)
          return
        }
        set({ expiringDocuments: data || [] })
      },

      fetchEmployeesPayments: async () => {
        try {
          const data = await pagamentosService.getAll()
          set({ employeePayments: data || [] })

          // Auto generate monthly obligations
          await get().generateMonthlyObligations()
        } catch (error) {
          console.error('Error fetching employee payments:', error)
        }
      },

      generateMonthlyObligations: async () => {
        const { employees } = get()
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()

        for (const emp of employees) {
          // Check if already has payment for this month
          const { data: existing } = await (supabase
            .from('pagamentos_colaboradores') as any)
            .select('id')
            .eq('colaborador_id', emp.id)
            .eq('mes', currentMonth + 1)
            .eq('ano', currentYear)
            .maybeSingle()

          if (existing) continue

          // Create obligation
          try {
            const payment = {
              colaborador_id: emp.id,
              valor_base: emp.salary || 0,
              mes: currentMonth + 1,
              ano: currentYear,
              status: 'pendente'
            }
            await pagamentosService.create(payment as any)
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
