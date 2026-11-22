// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// إعداد هوية النظام:
// الأخضر الداكن: #173F45
// الأخضر المؤسسي: #258579
// الخلفيات: #F4F6F7
const themeConfig = {
  token: {
    colorPrimary: '#258579',
    colorSuccess: '#2e7d32',
    colorWarning: '#ed6c02',
    colorError: '#d32f2f',
    colorInfo: '#173F45',
    colorBgBase: '#FFFFFF',
    fontFamily: "'Tajawal', 'IBM Plex Sans Arabic', sans-serif",
    borderRadius: 8,
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      siderBg: '#173F45',
      bodyBg: '#F4F6F7',
    },
    Menu: {
      darkItemBg: '#173F45',
      darkItemSelectedBg: '#258579',
      darkItemHoverBg: 'rgba(37, 133, 121, 0.3)',
      fontSize: 15,
    },
    Card: {
      borderRadiusLG: 10,
    },
    Button: {
      borderRadius: 6,
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider direction="rtl" locale={arEG} theme={themeConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  </React.StrictMode>
);
