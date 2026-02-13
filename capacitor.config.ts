import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.easybook.app',
  appName: '乐龄记账',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
