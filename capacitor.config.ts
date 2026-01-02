import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.a16f0c232fe14ad08bf2b544ca71cc19",
  appName: "generalvibes",
  webDir: "dist",
  server: {
    url: "https://a16f0c23-2fe1-4ad0-8bf2-b544ca71cc19.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a0a0a",
  },
  android: {
    backgroundColor: "#0a0a0a",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0a0a",
      showSpinner: false,
    },
  },
};

export default config;
