import './globals.css';
import { AppProvider } from './context/AppContext';

export const metadata = {
  title: 'RTO Luxury Admin',
  description: 'Admin panel for RTO Luxury',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
