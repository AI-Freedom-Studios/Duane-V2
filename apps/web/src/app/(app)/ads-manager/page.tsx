'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, BarChart3, DollarSign, Target } from 'lucide-react';

const adsPlatforms = [
  { name: 'Google Ads', description: 'Search, Display, and YouTube advertising', status: 'scaffold' },
  { name: 'Meta Ads', description: 'Facebook and Instagram ad campaigns', status: 'scaffold' },
  { name: 'LinkedIn Ads', description: 'Professional audience targeting', status: 'scaffold' },
  { name: 'TikTok Ads', description: 'Short-form video advertising', status: 'scaffold' },
  { name: 'X Ads', description: 'Twitter/X promoted content', status: 'scaffold' },
];

export default function AdsManagerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ads Manager</h1>
        <p className="text-muted-foreground">Manage advertising campaigns across platforms (Phase 2)</p>
      </div>

      {/* Summary Placeholder */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xl font-bold">$0</p>
            <p className="text-xs text-muted-foreground">Total Spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Active Campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Impressions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xl font-bold">0</p>
            <p className="text-xs text-muted-foreground">Connected Platforms</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adsPlatforms.map((platform) => (
          <Card key={platform.name} className="opacity-80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">{platform.name}</p>
                <Badge variant="secondary">Phase 2</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{platform.description}</p>
              <Button variant="outline" className="w-full" disabled>
                Connect Account
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex items-center justify-center p-12 text-center">
          <div>
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 font-semibold">Ads Manager - Coming in Phase 2</h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Full ad campaign management with OAuth connections, campaign creation, budget management, and analytics integration. Connect your advertising accounts to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
