import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, User, Heart } from 'lucide-react';

interface Donation {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
}

const AdminDonations = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, count: 0, average: 0 });

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setDonations(data);
      const total = data.reduce((sum, d) => sum + Number(d.amount), 0);
      setStats({
        total,
        count: data.length,
        average: data.length > 0 ? total / data.length : 0,
      });
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rasta-green/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-rasta-green" />
              </div>
              <div>
                <p className="text-2xl font-display text-primary">${stats.total.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Donations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-display text-primary">{stats.count}</p>
                <p className="text-sm text-muted-foreground">Total Supporters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rasta-gold/20 flex items-center justify-center">
                <User className="w-6 h-6 text-rasta-gold" />
              </div>
              <div>
                <p className="text-2xl font-display text-primary">${stats.average.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Average Donation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Donations List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Recent Donations</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No donations yet</p>
          ) : (
            <div className="space-y-4">
              {donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-start justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      {donation.is_anonymous ? (
                        <Heart className="w-5 h-5 text-primary" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {donation.is_anonymous ? 'Anonymous' : donation.donor_name || 'Supporter'}
                      </p>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground mt-1">"{donation.message}"</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(donation.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl text-rasta-green">
                      ${Number(donation.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDonations;