import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme-toggle';
import { useAuthStore } from '@/store';
import { Menu, User, LogOut } from 'lucide-react';

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="bg-background border-b h-14 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-50">
      {/* Left - Hamburger (same style as M logo) + Logo */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onMenuClick}
          aria-label="Toggle menu"
          className="h-8 w-8 shrink-0 rounded border bg-background"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border rounded flex items-center justify-center shrink-0 bg-background">
            <span className="font-bold text-sm">M</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-medium">بنك مسقط</span>
            <span className="text-xs text-muted-foreground">Bank Muscat</span>
          </div>
        </div>
      </div>

      {/* Right - Theme toggle + Account button */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Account menu"
              className="h-8 w-8 shrink-0 rounded border bg-background"
            >
              <span className="font-bold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Account Info
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => useAuthStore.getState().logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
