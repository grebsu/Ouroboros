import type { Metadata } from "next";

import { SidebarProvider } from "../context/SidebarContext";
import { DataProvider } from "../context/DataContext";
import { ThemeProvider } from "../context/ThemeContext";
import { NotificationProvider } from "../context/NotificationContext";
import Sidebar from "../components/Sidebar";
import MainContentWrapper from "../components/MainContentWrapper";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ouroboros",
  description: "Gerencie seus estudos de forma eficiente",
  icons: {
    icon: '/icon.svg?v=1',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <Providers>
          <SidebarProvider>
            <NotificationProvider>
              <ThemeProvider>
                <DataProvider>
                  <Sidebar />
                  <MainContentWrapper>
                    <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
                  </MainContentWrapper>
                </DataProvider>
              </ThemeProvider>
            </NotificationProvider>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
