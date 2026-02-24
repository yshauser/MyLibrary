import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1, sm: 2, md: 3 } }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
