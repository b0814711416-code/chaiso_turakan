import { Noto_Sans_Thai } from 'next/font/google';
import './globals.css';

const thai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata = {
  title: 'ติดตามงานธุรการ',
  description: 'แอปติดตามงานที่มอบหมายสำหรับเจ้าหน้าที่ธุรการโรงเรียน',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F766E',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={thai.className}>{children}</body>
    </html>
  );
}
