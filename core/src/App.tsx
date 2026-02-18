import { BrowserRouter, Route, Routes } from "react-router-dom"
import AppSidebar from "@/components/app-sidebar"
import Header from "@/components/header"
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar"

// Wrapper to handle sidebar toggle from Header
const AppLayout = () => {
  const { toggleSidebar } = useSidebar();
  return (
    <SidebarInset>
      <Header onMenuClick={toggleSidebar} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-20">
        {/* MFE slot: remote apps render inside <main> via Routes / Module Federation.
            Shell keeps: SidebarProvider + AppSidebar (left) + this SidebarInset (header + main).
            Each route can lazy-load a remote MFE component as the element. */}
        <main className="container py-6">
          <Routes>
            <Route path="/" element={
              <>
                <h1 className="text-3xl font-bold tracking-tight">Core Application - Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Welcome to the dashboard.
                </p>
              </>
            } />
            <Route path="/oms" element={
              <>
                <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your orders here.
                </p>
              </>
            } />
          </Routes>
        </main>
      </div>
    </SidebarInset>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <AppSidebar />
        <AppLayout />
      </SidebarProvider>
    </BrowserRouter>
  )
}
