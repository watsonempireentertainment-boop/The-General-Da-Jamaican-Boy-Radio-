import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Loader2, Check, AlertTriangle, Play, Mail, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminContentFilter = () => {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<{ scanned: number; markedExplicit: number } | null>(null);

  const handleScanAll = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('filter-explicit-content', {
        body: { action: 'scan_all' }
      });

      if (error) throw error;

      setResults({ scanned: data.scanned, markedExplicit: data.markedExplicit });
      toast.success(`Scanned ${data.scanned} tracks, marked ${data.markedExplicit} as explicit`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to scan content');
    }
    setScanning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display text-foreground">Content Filter</h2>
        <p className="text-muted-foreground">Scan and tag explicit content</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Explicit Content Scanner
          </CardTitle>
          <CardDescription>
            Automatically scan song titles and descriptions for explicit content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleScanAll} disabled={scanning} variant="gold">
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Scan All Tracks
              </>
            )}
          </Button>

          {results && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Check className="w-5 h-5 text-rasta-green" />
              <div>
                <p className="font-medium">Scan Complete</p>
                <p className="text-sm text-muted-foreground">
                  Scanned {results.scanned} tracks, marked {results.markedExplicit} as explicit
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContentFilter;
