import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "EnrollMate",
  description: "Never struggle with enrollment again",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-jakarta">
        {children}
        <Script
          id="fetch-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try{
                  if(typeof window==='undefined') return;
                  if(window.__fetchGuardInstalled) return;
                  const orig = (typeof window.fetch === 'function' && window.fetch.bind) ? window.fetch.bind(window) : window.fetch;
                  Object.defineProperty(window,'fetch',{
                    value:function(){return orig.apply(this,arguments);},
                    writable:false,
                    configurable:false
                  });
                  window.__fetchGuardInstalled=true;
                }catch(e){
                  console.warn('fetch guard failed',e);
                }
              })();
            `
          }}
        />
      </body>
    </html>
  );
}
