import "./globals.css";

export const metadata = {
  title: "EnrollMate",
  description: "Never struggle with enrollment again",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{__html: `(function(){try{if(typeof window==='undefined')return; if(window.__fetchGuardInstalled) return; const orig = (typeof window.fetch === 'function' && window.fetch.bind) ? window.fetch.bind(window) : window.fetch; Object.defineProperty(window,'fetch',{value:function(){return orig.apply(this,arguments);},writable:false,configurable:false}); window.__fetchGuardInstalled=true;}catch(e){console.warn('fetch guard failed',e);} })();`}} />
      </head>
      <body className="antialiased font-jakarta">
        {children}
      </body>
    </html>
  );
}
