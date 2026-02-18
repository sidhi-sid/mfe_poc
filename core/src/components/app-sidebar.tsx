import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';
import {
  LayoutDashboard,
  ClipboardList,
  Globe,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/oms', label: 'Order Management', icon: ClipboardList },
];

const AppSidebar = () => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="flex h-full flex-col justify-between">
      <div className="flex flex-col flex-1 min-h-0">
        {/* User Greeting - "Hello! Avinash" */}
        <SidebarHeader className="shrink-0 bg-sidebar-primary text-sidebar-primary-foreground px-4 py-3 group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-semibold truncate">Hello! {user?.name || 'User'}</p>
        </SidebarHeader>

        {/* Navigation - Dashboard, Order Management (flex-1 so footer is pushed down) */}
        <SidebarContent className="flex-1 min-h-0 overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="px-2 gap-0.5">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          isActive &&
                            'bg-blue-100! text-blue-800! dark:bg-gray-600! dark:text-white! font-medium'
                        )}
                      >
                        <NavLink
                          to={item.path}
                          onClick={() => {
                            if (isMobile) setOpenMobile(false);
                          }}
                        >
                          <item.icon className="h-5 w-5 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>

      {/* Footer - Arabic, Logout (fixed at bottom) */}
      <SidebarFooter className="shrink-0 border-t border-sidebar-border bg-sidebar p-2">
        <SidebarSeparator className="mb-2" />
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Arabic"
              className="w-full justify-center bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              <Globe className="h-4 w-4" />
              <span>Arabic</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              className="w-full justify-center bg-sidebar-primary text-red-500 hover:bg-red-500/10 hover:text-red-600 dark:bg-gray-700 dark:text-red-400 dark:hover:bg-gray-600 dark:hover:text-red-300"
              onClick={() => useAuthStore.getState().logout()}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
