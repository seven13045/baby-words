import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.babywords.app',
  appName: '宝宝单词',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
