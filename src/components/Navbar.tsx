import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavigationMenuConfig, NavigationGroup } from '../utils/navigationConfig';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from './ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from './ui/sheet';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown,
  Shield
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const NavDropdown: React.FC<{ group: NavigationGroup }> = ({ group }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost">
        {group.name} <ChevronDown className="ml-2 h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {group.items.map(item => (
        <DropdownMenuItem key={item.href} asChild>
          <Link to={item.href} className="flex items-center">
            {item.icon}
            <span className="ml-2">{item.label}</span>
          </Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Public Navigation for logged-out users
  if (!user) {
    return (
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="BEPAWA Logo" className="h-10 w-auto" />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">BEPAWA</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
              <Button onClick={() => navigate('/register')}>Join Healthcare Network</Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Authenticated User Navigation
  const navigationConfig = new NavigationMenuConfig(user.role);
  const menuGroups = navigationConfig.getMenuGroups();

  const getRoleName = () => {
    if (!user || !user.role) return 'User';
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="BEPAWA Logo" className="h-10 w-auto" />
            </Link>
            <nav className="hidden md:flex items-center space-x-1">
              {menuGroups.map(group => <NavDropdown key={group.name} group={group} />)}
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">1</Badge>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>{getRoleName()}</span>
                  </div>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={logout}><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden"><Menu className="h-5 w-5" /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-sm">
                <SheetHeader><SheetTitle>Navigation</SheetTitle></SheetHeader>
                <nav className="mt-6 space-y-4">
                  {menuGroups.map((group) => (
                    <div key={group.name}>
                      <h3 className="mb-2 text-sm font-semibold text-gray-500">{group.name}</h3>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${location.pathname === item.href ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                          >
                            {React.cloneElement(item.icon, { className: "h-5 w-5" })}
                            <span className="ml-3">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
