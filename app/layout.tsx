import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Academic Humanizer Pro — Your ideas, clearly expressed',description:'A thoughtful academic writing workspace with citation safeguards and reviewable revisions.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
