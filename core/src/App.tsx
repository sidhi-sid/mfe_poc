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
        {/* Main Content Area (Placeholder for MFEs) */}
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
