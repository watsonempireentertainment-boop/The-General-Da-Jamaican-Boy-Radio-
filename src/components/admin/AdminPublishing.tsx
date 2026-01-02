import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Download, Smartphone, Globe, CheckCircle, Copy, ExternalLink, Image, Music, Edit, Save, Upload, FileText, Package, Key, Shield } from 'lucide-react';

interface AppAsset {
  name: string;
  size: string;
  required: boolean;
  description: string;
  file?: File | null;
  preview?: string;
}

const AdminPublishing = () => {
  const { toast } = useToast();
  const [packageName, setPackageName] = useState('com.thegeneraldajamaicanboy.app');
  const [sha256, setSha256] = useState('');
  const [appName, setAppName] = useState('The General Da Jamaican Boy');
  const [shortDescription, setShortDescription] = useState('Official music app featuring the latest tracks from The General Da Jamaican Boy');
  const [fullDescription, setFullDescription] = useState(`Experience the authentic reggae vibes of The General Da Jamaican Boy!

🎵 Features:
• Stream all tracks and albums
• High-quality audio playback
• Offline listening (coming soon)
• Latest news and updates
• Connect with the community

🇯🇲 Straight from Jamaica with love!

Download now and feel the rhythm of true reggae music.`);
  
  const [assets, setAssets] = useState<AppAsset[]>([
    { name: 'App Icon (512x512)', size: '512x512', required: true, description: 'Main app icon shown in Play Store' },
    { name: 'Feature Graphic (1024x500)', size: '1024x500', required: true, description: 'Banner shown at top of store listing' },
    { name: 'Screenshot 1 (Phone)', size: '1080x1920', required: true, description: 'Phone screenshot' },
    { name: 'Screenshot 2 (Phone)', size: '1080x1920', required: true, description: 'Phone screenshot' },
    { name: 'Screenshot 3 (Phone)', size: '1080x1920', required: false, description: 'Optional phone screenshot' },
    { name: 'Screenshot 4 (Tablet)', size: '1920x1200', required: false, description: 'Optional tablet screenshot' },
  ]);

  const siteUrl = window.location.origin;

  const generateAssetLinks = () => {
    if (!sha256) {
      toast({ title: 'Error', description: 'Please enter your SHA-256 fingerprint', variant: 'destructive' });
      return;
    }

    const assetLinks = [{
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: packageName,
        sha256_cert_fingerprints: [sha256]
      }
    }];

    const blob = new Blob([JSON.stringify(assetLinks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assetlinks.json';
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Downloaded', description: 'assetlinks.json file downloaded. Upload to public/.well-known/ folder.' });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  const handleAssetUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload to storage
    const fileExt = file.name.split('.').pop();
    const fileName = `play-store/${assets[index].name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: 'Upload Failed', description: uploadError.message, variant: 'destructive' });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(fileName);

    const newAssets = [...assets];
    newAssets[index] = { ...newAssets[index], file, preview: publicUrl };
    setAssets(newAssets);
    
    toast({ title: 'Uploaded', description: `${assets[index].name} uploaded successfully` });
  };

  const downloadStoreDescription = () => {
    const content = `APP NAME:
${appName}

SHORT DESCRIPTION (80 characters max):
${shortDescription}

FULL DESCRIPTION (4000 characters max):
${fullDescription}

---
Character counts:
- Short description: ${shortDescription.length}/80
- Full description: ${fullDescription.length}/4000
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'play-store-listing.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: 'Downloaded', description: 'Store listing text downloaded' });
  };

  const steps = [
    {
      title: 'Install Android Studio',
      description: 'Download and install Android Studio from developer.android.com',
      link: 'https://developer.android.com/studio',
      icon: <Smartphone className="w-4 h-4" />
    },
    {
      title: 'Create Google Play Developer Account',
      description: 'Sign up for a Google Play Developer account ($25 one-time fee)',
      link: 'https://play.google.com/console/signup',
      icon: <Key className="w-4 h-4" />
    },
    {
      title: 'Open Google Play Console',
      description: 'Access your Google Play Console dashboard to manage your apps',
      link: 'https://play.google.com/console',
      icon: <ExternalLink className="w-4 h-4" />
    },
    {
      title: 'Generate Signed APK/AAB',
      description: 'Use Android Studio to create a signed Android App Bundle (.aab)',
      icon: <Package className="w-4 h-4" />
    },
    {
      title: 'Get SHA-256 Fingerprint',
      description: 'Run: keytool -list -v -keystore your-release-key.keystore',
      icon: <Shield className="w-4 h-4" />
    },
    {
      title: 'Upload assetlinks.json',
      description: 'Download and place in public/.well-known/assetlinks.json',
      icon: <FileText className="w-4 h-4" />
    },
    {
      title: 'Submit to Play Store',
      description: 'Upload your AAB file to the Google Play Console',
      icon: <Upload className="w-4 h-4" />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-foreground">GOOGLE PLAY STORE PUBLISHING</h2>
        <p className="text-muted-foreground">Everything you need to publish your app to the Google Play Store</p>
      </div>

      <Tabs defaultValue="build" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="build" className="gap-2">
            <Package className="w-4 h-4" />
            Build APK
          </TabsTrigger>
          <TabsTrigger value="setup" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Setup Guide
          </TabsTrigger>
          <TabsTrigger value="listing" className="gap-2">
            <FileText className="w-4 h-4" />
            Store Listing
          </TabsTrigger>
          <TabsTrigger value="assets" className="gap-2">
            <Image className="w-4 h-4" />
            Graphics
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Globe className="w-4 h-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        {/* Build APK Tab - NEW */}
        <TabsContent value="build" className="space-y-6">
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Package className="w-6 h-6" />
                Generate Android App Bundle (AAB) or APK
              </CardTitle>
              <CardDescription>Follow these steps to create your app for Google Play Store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Clone Repository */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                  Clone Your Project
                </h4>
                <p className="text-sm text-muted-foreground ml-8">Export to GitHub and clone locally:</p>
                <div className="ml-8 bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <p className="text-primary"># Export project to GitHub first (from Settings)</p>
                  <p className="mt-2">git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git</p>
                  <p>cd YOUR_REPO</p>
                  <p>npm install</p>
                </div>
              </div>

              {/* Step 2: Add Capacitor */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                  Initialize Capacitor
                </h4>
                <p className="text-sm text-muted-foreground ml-8">Add Capacitor to your project:</p>
                <div className="ml-8 bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <p className="text-primary"># Install Capacitor dependencies</p>
                  <p>npm install @capacitor/core @capacitor/cli @capacitor/android</p>
                  <p className="mt-2 text-primary"># Initialize Capacitor</p>
                  <p>npx cap init "The General Da Jamaican Boy" "com.thegeneraldajamaicanboy.app"</p>
                  <p className="mt-2 text-primary"># Add Android platform</p>
                  <p>npx cap add android</p>
                </div>
              </div>

              {/* Step 3: Build */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                  Build the App
                </h4>
                <p className="text-sm text-muted-foreground ml-8">Create production build and sync:</p>
                <div className="ml-8 bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <p className="text-primary"># Build the web app</p>
                  <p>npm run build</p>
                  <p className="mt-2 text-primary"># Sync with Android</p>
                  <p>npx cap sync android</p>
                  <p className="mt-2 text-primary"># Open in Android Studio</p>
                  <p>npx cap open android</p>
                </div>
              </div>

              {/* Step 4: Generate Signed AAB */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">4</span>
                  Generate Signed App Bundle
                </h4>
                <p className="text-sm text-muted-foreground ml-8">In Android Studio:</p>
                <div className="ml-8 bg-muted rounded-lg p-4 text-sm space-y-2">
                  <p>1. Go to <strong>Build → Generate Signed Bundle / APK</strong></p>
                  <p>2. Select <strong>Android App Bundle</strong> (recommended for Play Store)</p>
                  <p>3. Create a new keystore or use existing one:</p>
                  <ul className="list-disc ml-6 text-muted-foreground">
                    <li>Key store path: Choose a secure location</li>
                    <li>Key store password: Create strong password</li>
                    <li>Key alias: e.g., "release-key"</li>
                    <li>Key password: Create another strong password</li>
                  </ul>
                  <p>4. Select <strong>release</strong> build variant</p>
                  <p>5. Click <strong>Finish</strong> to generate the AAB file</p>
                </div>
              </div>

              {/* Step 5: Upload */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rasta-green text-white flex items-center justify-center text-sm">5</span>
                  Upload to Play Store
                </h4>
                <p className="text-sm text-muted-foreground ml-8">Submit your app:</p>
                <div className="ml-8 space-y-2">
                  <a 
                    href="https://play.google.com/console" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="gold" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open Google Play Console
                    </Button>
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Upload your .aab file to the Production or Internal Testing track
                  </p>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-rasta-gold/10 border border-rasta-gold/30 rounded-lg p-4">
                <h4 className="font-semibold text-rasta-gold mb-2">Important Notes</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• <strong>Keep your keystore safe</strong> - you'll need it for all future updates</li>
                  <li>• AAB files are preferred over APK for Play Store submission</li>
                  <li>• First-time developers need to pay $25 Google Play Developer fee</li>
                  <li>• App review typically takes 1-3 days</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Alternative: PWA Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Quick Alternative: PWA Builder
              </CardTitle>
              <CardDescription>Fastest way to get an APK without Android Studio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                PWA Builder can convert your website into an Android app automatically:
              </p>
              <ol className="list-decimal ml-6 text-sm space-y-2">
                <li>Visit <strong>pwabuilder.com</strong></li>
                <li>Enter your site URL: <code className="bg-muted px-2 py-0.5 rounded">{siteUrl}</code></li>
                <li>Click "Start" and wait for analysis</li>
                <li>Select "Android" and download the APK package</li>
                <li>Upload to Google Play Console</li>
              </ol>
              <a 
                href="https://www.pwabuilder.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="gap-2 mt-2">
                  <ExternalLink className="w-4 h-4" />
                  Open PWA Builder
                </Button>
              </a>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Publishing Checklist
                </CardTitle>
                <CardDescription>Follow these steps to publish your app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                      {step.link && (
                        <a 
                          href={step.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Open Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Quick Build Options
                </CardTitle>
                <CardDescription>Fastest ways to create your Android app</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    Option 1: PWA Builder (Easiest)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Upload your site URL and download a ready-to-publish APK
                  </p>
                  <a 
                    href="https://www.pwabuilder.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open PWA Builder
                    </Button>
                  </a>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    Option 2: Bubblewrap CLI
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Command-line tool for advanced users
                  </p>
                  <div className="bg-background rounded p-3 font-mono text-xs overflow-x-auto">
                    <p>npm i -g @aspect-apps/aspect-cli</p>
                    <p className="mt-1">npx aspect-cli init</p>
                    <p className="mt-1">npx aspect-cli build</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    Option 3: Capacitor (Native)
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Full native Android app with access to all device features
                  </p>
                  <div className="bg-background rounded p-3 font-mono text-xs overflow-x-auto">
                    <p>npm i @capacitor/core @capacitor/cli</p>
                    <p className="mt-1">npx cap init</p>
                    <p className="mt-1">npx cap add android</p>
                    <p className="mt-1">npx cap sync</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="listing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Store Listing Content
              </CardTitle>
              <CardDescription>Edit your Google Play Store listing text</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">App Name (30 characters max)</Label>
                <Input
                  id="appName"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">{appName.length}/30 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDesc">Short Description (80 characters max)</Label>
                <Textarea
                  id="shortDesc"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  maxLength={80}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">{shortDescription.length}/80 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDesc">Full Description (4000 characters max)</Label>
                <Textarea
                  id="fullDesc"
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  maxLength={4000}
                  rows={10}
                />
                <p className="text-xs text-muted-foreground">{fullDescription.length}/4000 characters</p>
              </div>

              <Button onClick={downloadStoreDescription} className="gap-2">
                <Download className="w-4 h-4" />
                Download Store Listing Text
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Required Graphics
              </CardTitle>
              <CardDescription>Upload screenshots and graphics for your store listing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.description}</p>
                      </div>
                      {asset.required && (
                        <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Required</span>
                      )}
                    </div>
                    
                    {asset.preview ? (
                      <div className="relative">
                        <img 
                          src={asset.preview} 
                          alt={asset.name}
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="absolute bottom-2 right-2 gap-1"
                          onClick={() => {
                            const input = document.getElementById(`asset-${index}`) as HTMLInputElement;
                            input?.click();
                          }}
                        >
                          <Edit className="w-3 h-3" />
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="h-32 border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          const input = document.getElementById(`asset-${index}`) as HTMLInputElement;
                          input?.click();
                        }}
                      >
                        <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                        <p className="text-xs text-muted-foreground">{asset.size}</p>
                      </div>
                    )}
                    
                    <input
                      id={`asset-${index}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAssetUpload(index, e)}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Google Play Store Image Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>App Icon:</strong> 512x512 PNG (no alpha/transparency)</li>
                  <li>• <strong>Feature Graphic:</strong> 1024x500 PNG or JPG</li>
                  <li>• <strong>Screenshots:</strong> Min 2 required, 320px-3840px, 16:9 or 9:16 ratio</li>
                  <li>• <strong>Promo Video:</strong> Optional YouTube URL</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Generate assetlinks.json
                </CardTitle>
                <CardDescription>Required for Google Play Store verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="package">Package Name</Label>
                  <Input
                    id="package"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="com.yourapp.name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sha256">SHA-256 Certificate Fingerprint</Label>
                  <Input
                    id="sha256"
                    value={sha256}
                    onChange={(e) => setSha256(e.target.value)}
                    placeholder="AA:BB:CC:DD:EE:FF:..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from your keystore: keytool -list -v -keystore your-key.keystore
                  </p>
                </div>

                <Button onClick={generateAssetLinks} className="w-full" variant="gold">
                  <Download className="w-4 h-4 mr-2" />
                  Download assetlinks.json
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Configuration</CardTitle>
                <CardDescription>Your app's PWA configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Site URL</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-muted px-3 py-2 rounded truncate">{siteUrl}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(siteUrl)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Package Name</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-muted px-3 py-2 rounded">{packageName}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(packageName)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">App Name</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-muted px-3 py-2 rounded">{appName}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(appName)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPublishing;
