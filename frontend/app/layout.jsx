import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
  title: "CHEM.AI - Research Lab",
  description: "AI-Powered Molecular Synthesis & Analysis",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSME Script */}
        <script type="text/javascript" language="javascript" src="https://jsme-editor.github.io/dist/jsme/jsme.nocache.js"></script>
      </head>
      <body className="bg-background text-foreground antialiased selection:bg-primary/20">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
            <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
