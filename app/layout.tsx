import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "BLACK RAZOR — Твой стиль. Наш характер.",
  description:
    "Концепт барбершопа BLACK RAZOR. Мужские стрижки, оформление бороды и внимание к каждой детали. Демонстрационная онлайн-запись.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
