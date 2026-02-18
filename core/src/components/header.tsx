import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore, useThemeStore } from '@/store';
import { Menu, ChevronDown, User, LogOut, Moon } from 'lucide-react';

const THEMES = [
  { name: 'Black', value: 'black', bg: 'bg-gray-900', ring: 'ring-gray-900' },
  { name: 'Red', value: 'red', bg: 'bg-red-600', ring: 'ring-red-600' },
  { name: 'Blue', value: 'blue', bg: 'bg-blue-600', ring: 'ring-blue-600' },
  { name: 'Green', value: 'green', bg: 'bg-green-600', ring: 'ring-green-600' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-600', ring: 'ring-purple-600' },
  { name: 'Orange', value: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
];

const colorMap: Record<string, string> = {
  black: 'bg-gray-900', red: 'bg-red-600', blue: 'bg-blue-600', green: 'bg-green-600',
  purple: 'bg-purple-600', orange: 'bg-orange-500',
};

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const user = useAuthStore((state) => state.user);
  const { color, setColor } = useThemeStore();

  const currentTheme = THEMES.find((t) => t.value === color) || THEMES[0];

  return (
    <header className="bg-gray-900 border-b border-gray-800 h-16 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-50">
      {/* Left side - Hamburger menu and Logo */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Toggle menu"
          className="text-white hover:bg-gray-800 hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo - Bank Muscat */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">بنك مسقط</span>
            <span className="text-xs text-gray-300">Bank Muscat</span>
          </div>
        </div>
      </div>

      {/* Right side - Theme picker + User dropdown */}
      <div className="flex items-center gap-2">
        {/* Theme */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-gray-200 hover:bg-gray-800 hover:text-white border border-gray-700"
            >
              <Moon className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">Theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel className="text-xs">Choose Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {THEMES.map((theme) => (
              <DropdownMenuItem
                key={theme.value}
                onClick={() => setColor(theme.value)}
                className="gap-3 cursor-pointer"
              >
                <div
                  className={`w-4 h-4 rounded-full ${theme.bg} ${color === theme.value ? 'ring-2 ring-offset-2 ' + theme.ring : ''
                    }`}
                />
                <span className="text-sm">{theme.name}</span>
                {color === theme.value && (
                  <span className="ml-auto text-xs text-muted-foreground">✓</span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-gray-200 hover:bg-gray-800 hover:text-white"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gray-700 text-white text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline-block text-white">
                {user?.name || 'User'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
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
            <DropdownMenuItem
              onClick={() => useAuthStore.getState().logout()}
              className="text-destructive focus:text-destructive"
            >
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
