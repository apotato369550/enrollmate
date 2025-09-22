import "./globals.css";

export const metadata = {
  title: "EnrollMate",
  description: "Never struggle with enrollment again",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-jakarta">
        {children}
      </body>
    </html>
  );
}
