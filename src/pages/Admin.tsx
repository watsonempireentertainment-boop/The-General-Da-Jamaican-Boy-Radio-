import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminMediaManager from '@/components/admin/AdminMediaManager';
import AdminArtistProfile from '@/components/admin/AdminArtistProfile';
import AdminNewsManager from '@/components/admin/AdminNewsManager';
import AdminSubmissions from '@/components/admin/AdminSubmissions';
import AdminDonations from '@/components/admin/AdminDonations';
import AdminArtists from '@/components/admin/AdminArtists';
import AdminMusicDiscovery from '@/components/admin/AdminMusicDiscovery';
import AdminPublishing from '@/components/admin/AdminPublishing';
import AdminAlbums from '@/components/admin/AdminAlbums';
import AdminDashboardStats from '@/components/admin/AdminDashboardStats';
import AdminEmbedAnalytics from '@/components/admin/AdminEmbedAnalytics';
import AdminRadioSettings from '@/components/admin/AdminRadioSettings';
import AdminContentFilter from '@/components/admin/AdminContentFilter';
import AdminNewsletter from '@/components/admin/AdminNewsletter';
import MusicImport from '@/components/MusicImport';

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/auth');
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardStats />;
      case 'media':
        return <AdminMediaManager />;
      case 'albums':
        return <AdminAlbums />;
      case 'submissions':
        return <AdminSubmissions />;
      case 'artists':
        return <AdminArtists />;
      case 'embed-analytics':
        return <AdminEmbedAnalytics />;
      case 'soundcloud-import':
        return <MusicImport />;
      case 'radio-settings':
        return <AdminRadioSettings />;
      case 'content-filter':
        return <AdminContentFilter />;
      case 'newsletter':
        return <AdminNewsletter />;
      case 'discovery':
        return <AdminMusicDiscovery />;
      case 'donations':
        return <AdminDonations />;
      case 'profile':
        return <AdminArtistProfile />;
      case 'news':
        return <AdminNewsManager />;
      case 'publish':
        return <AdminPublishing />;
      default:
        return <AdminDashboardStats />;
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      media: 'Media Manager',
      albums: 'Albums & Mixtapes',
      submissions: 'Submissions',
      artists: 'Artists',
      'embed-analytics': 'Embed Analytics',
      'soundcloud-import': 'Import Music',
      'radio-settings': 'Radio Settings',
      'content-filter': 'Content Filter',
      'newsletter': 'Newsletter',
      discovery: 'Music Discovery',
      donations: 'Donations',
      profile: 'Artist Profile',
      news: 'News Manager',
      publish: 'App Publishing',
    };
    return titles[activeTab] || 'Admin';
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          userEmail={user?.email}
        />
        
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3 md:hidden">
            <SidebarTrigger className="h-9 w-9" />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-lg text-primary truncate">{getPageTitle()}</h1>
            </div>
          </header>

          {/* Desktop Header */}
          <header className="hidden md:flex sticky top-0 z-40 bg-card border-b border-border px-6 py-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="font-display text-2xl text-primary">{getPageTitle()}</h1>
                <p className="text-sm text-muted-foreground">Manage your content</p>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-4 md:p-6 overflow-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
