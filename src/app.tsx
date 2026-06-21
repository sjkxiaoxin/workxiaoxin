import { PropsWithChildren } from 'react';
import { LucideTaroProvider } from 'lucide-react-taro';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { Preset } from './presets';
import Taro, { useLaunch } from '@tarojs/taro';

const App = ({ children }: PropsWithChildren) => {
  // 微信隐私协议弹窗（审核必须）
  useLaunch(() => {
    try {
      const wx = Taro.getTargetInstance().wx || (globalThis as any).wx
      if (wx?.requirePrivacyAuthorize) {
        wx.requirePrivacyAuthorize({
          success: () => console.log('隐私协议已同意'),
          fail: () => console.log('隐私协议拒绝'),
        })
      }
    } catch (e) {
      // 非微信环境忽略
    }
  })

  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  );
};

export default App;
