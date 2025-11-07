import '../global.css';  
import React from 'react';

export const metadata = {
  title: 'React App',
  description: 'Web site created with Next.js (migrated from CRA)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Web site created with Next.js" />
        <title>React App</title>
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
