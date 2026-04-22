'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

const TOOLS = [
  { href: '/tools/cv-builder', label: 'CV Builder', desc: 'Create professional resumes', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { href: '/tools/document-converter', label: 'Document Converter', desc: 'Convert between formats', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { href: '/tools/image-converter', label: 'Image Converter', desc: 'Convert and optimize images', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileTools, setMobileTools] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openTools = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setToolsOpen(true); };
  const closeTools = () => { closeTimer.current = setTimeout(() => setToolsOpen(false), 150); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-blue-200 flex items-center justify-between px-6 shadow-sm">

      <Link href="/" className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 bg-blue-600 rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">Eazitool</h1>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 text-blue-800 hover:text-blue-600 font-medium transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </Link>

        <div className="relative" onMouseEnter={openTools} onMouseLeave={closeTools}>
          <button
            onClick={() => setToolsOpen(v => !v)}
            className="flex items-center gap-1.5 text-blue-800 hover:text-blue-600 font-medium transition-colors"
          >
            Tools
            <svg className={`w-4 h-4 transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {toolsOpen && (
            <div onMouseEnter={openTools} onMouseLeave={closeTools} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-xl shadow-lg border border-blue-100 p-2">
              {TOOLS.map((tool, i) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setToolsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors ${i !== TOOLS.length - 1 ? 'mb-1' : ''}`}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">{tool.label}</p>
                    <p className="text-xs text-blue-500">{tool.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="#services" className="text-blue-800 hover:text-blue-600 font-medium transition-colors">Services</Link>
        <Link href="#contact" className="text-blue-800 hover:text-blue-600 font-medium transition-colors">Contact</Link>
      </div>

      <button className="md:hidden p-2" onClick={() => setMobileOpen(v => !v)}>
        <svg className="w-6 h-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
        </svg>
      </button>

      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-blue-100 shadow-lg md:hidden">
          <div className="p-4 space-y-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-blue-800 hover:bg-blue-50 font-medium"
              onClick={() => setMobileOpen(false)}
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>

            <button onClick={() => setMobileTools(v => !v)} className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-blue-800 hover:bg-blue-50 font-medium">
              Tools
              <svg className={`w-4 h-4 ${mobileTools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileTools && (
              <div className="ml-4 space-y-2 py-2">
                {TOOLS.map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    onClick={() => { setMobileOpen(false); setMobileTools(false); }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-blue-50"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tool.icon} />
                      </svg>
                    </div>
                    <span className="text-blue-800 font-medium text-sm">{tool.label}</span>
                  </Link>
                ))}
              </div>
            )}

            <Link href="#services" className="block px-4 py-2.5 rounded-lg text-blue-800 hover:bg-blue-50" onClick={() => setMobileOpen(false)}>Services</Link>
            <Link href="#contact" className="block px-4 py-2.5 rounded-lg text-blue-800 hover:bg-blue-50" onClick={() => setMobileOpen(false)}>Contact</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
