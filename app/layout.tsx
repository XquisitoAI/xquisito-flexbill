import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { TableProvider } from "./context/TableContext";
import { GuestProvider } from "./context/GuestContext";
import { PaymentProvider } from "./context/PaymentContext";
import { RestaurantProvider } from "./context/RestaurantContext";
import { AuthProvider } from "./context/AuthContext";

const helveticaNeue = localFont({
  src: [
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueUltraLight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueUltraLightItalic.otf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueLightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueRoman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueMedium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueMediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueBold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueBoldItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueHeavy.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueHeavyItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueBlack.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../public/fonts/helvetica-neue/HelveticaNeueBlackItalic.otf",
      weight: "800",
      style: "italic",
    },
  ],
  variable: "--font-helvetica-neue",
});

export const metadata: Metadata = {
  title: "Xquisito Flex Bill",
  description: "Tu menú digital con un toque de NFC",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/logo-short-green.webp",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/iso-1-white.webp",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head></head>
      <body
        className={`${helveticaNeue.variable} antialiased`}
        style={{ fontFamily: "var(--font-helvetica-neue)" }}
      >
        <AuthProvider>
          <RestaurantProvider>
            <CartProvider>
              <TableProvider>
                <GuestProvider>
                  <PaymentProvider>{children}</PaymentProvider>
                </GuestProvider>
              </TableProvider>
            </CartProvider>
          </RestaurantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
