import { Link } from 'react-router-dom';
import { 
  Music, 
  Disc, 
  Users, 
  User, 
  Search, 
  DollarSign, 
  FileText, 
  Smartphone,
  ArrowLeft,
  Settings,
  LayoutDashboard,
  Code2,
  CloudDownload,
  Radio,
  Shield,
  Mail
} from 'lucide-react';
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userEmail?: string;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'media', label: 'Media', icon: Music },
  { id: 'albums', label: 'Albums', icon: Disc },
  { id: 'submissions', label: 'Submissions', icon: Users },
  { id: 'artists', label: 'Artists', icon: User },
  { id: 'embed-analytics', label: 'Embed Analytics', icon: Code2 },
  { id: 'soundcloud-import', label: 'Import Music', icon: CloudDownload },
  { id: 'radio-settings', label: 'Radio Settings', icon: Radio },
  { id: 'content-filter', label: 'Content Filter', icon: Shield },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
  { id: 'discovery', label: 'Discovery', icon: Search },
  { id: 'donations', label: 'Donations', icon: DollarSign },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'news', label: 'News', icon: FileText },
  { id: 'publish', label: 'Publish', icon: Smartphone },
];

const AdminSidebar = ({ activeTab, onTabChange, userEmail }: AdminSidebarProps) => {
  const { setOpenMobile, isMobile } = useSidebar();

  const handleItemClick = (id: string) => {
    onTabChange(id);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rasta-red via-primary to-rasta-green flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg text-primary truncate">ADMIN</h2>
            <p className="text-xs text-muted-foreground truncate">Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <Separator className="mx-4" />

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-2">
            Content Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.slice(0, 5).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => handleItemClick(item.id)}
                    tooltip={item.label}
                    className="w-full justify-start gap-3"
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-2">
            Tools & Discovery
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.slice(5, 11).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => handleItemClick(item.id)}
                    tooltip={item.label}
                    className="w-full justify-start gap-3"
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground px-2">
            Settings & Publishing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.slice(11).map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeTab === item.id}
                    onClick={() => handleItemClick(item.id)}
                    tooltip={item.label}
                    className="w-full justify-start gap-3"
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4" />
        {userEmail && (
          <p className="text-xs text-muted-foreground truncate mb-3 px-2">
            {userEmail}
          </p>
        )}
        <Link to="/">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Site
          </Button>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
