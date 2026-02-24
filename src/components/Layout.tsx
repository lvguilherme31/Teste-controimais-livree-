import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import { useAppStore } from '@/stores/useAppStore'

export default function Layout() {
  // Removed authentication check and redirect logic
  // The app now allows public access for prototyping

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-secondary/10">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
