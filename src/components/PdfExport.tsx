'use client'
import { useState, useRef } from 'react'
import type { Entry } from '@/lib/supabase'

interface PdfExportProps {
  entries: Entry[]
  theme: string
}

export default function PdfExport({ entries, theme }: PdfExportProps) {
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)

  const themeColors: Record<string, { bg: string; accent: string; text: string }> = {
    nostalgia: { bg: '#f9f3e3', accent: '#d4a017', text: '#2c1a0e' },
    bollywood: { bg: '#fff0f5', accent: '#e91e8c', text: '#4a0028' },
    kpop: { bg: '#f0f0ff', accent: '#7c3aed', text: '#1a0040' },
  }
  const tc = themeColors[theme] || themeColors.nostalgia

  const handleExport = async () => {
    setGenerating(true)
    setDone(false)

    try {
      // Dynamic import to avoid SSR issues
      const [jsPDFModule, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const jsPDF = jsPDFModule.default
      const html2canvas = html2canvasModule.default

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      const pageH = 297
      const margin = 15
      const contentW = pageW - margin * 2

      // Build a hidden DOM element, render, and capture
      const container = document.createElement('div')
      container.style.cssText = `
        width: 794px; /* ~A4 at 96dpi */
        background: ${tc.bg};
        font-family: 'Indie Flower', cursive;
        padding: 40px;
        color: ${tc.text};
        position: fixed;
        left: -9999px;
        top: 0;
      `

      // Cover page
      container.innerHTML = `
        <div style="text-align:center; padding: 60px 0; border-bottom: 3px solid ${tc.accent}88; margin-bottom:40px;">
          <div style="font-size:64px; margin-bottom:16px;">📚</div>
          <h1 style="font-size:48px; color:${tc.accent}; margin:0; font-family:'Homemade Apple',cursive;">SlamSpace</h1>
          <p style="font-size:18px; margin:8px 0; opacity:0.7;">Where Friendships Live Forever ✨</p>
          <p style="font-size:14px; opacity:0.5; margin:4px 0;">Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p style="font-size:14px; opacity:0.5;">${entries.length} entries • ${theme} edition</p>
        </div>
        ${entries
          .filter(e => !e.unlock_at || new Date(e.unlock_at) <= new Date())
          .map(e => `
          <div style="
            background:white;
            border-left: 5px solid ${tc.accent};
            border-radius:16px;
            padding:20px 24px;
            margin-bottom:24px;
            box-shadow:0 4px 16px rgba(0,0,0,0.08);
            page-break-inside: avoid;
          ">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div style="flex:1;">
                <h2 style="font-size:22px; color:${tc.accent}; margin:0 0 4px;">${e.name}</h2>
                <p style="font-size:13px; opacity:0.5; margin:0 0 12px; font-family:sans-serif;">
                  ${new Date(e.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                  · Friendship: ${e.friendship_level}/10
                  ${'⭐'.repeat(Math.round(e.friendship_level / 2))}
                </p>
              </div>
              <div style="width:12px; height:12px; border-radius:50%; background:${e.fav_color}; margin-left:8px; flex-shrink:0;"></div>
            </div>
            <p style="font-size:15px; line-height:1.6; margin:0 0 12px;">${e.message}</p>
            ${e.ai_poem ? `<div style="background:${tc.bg}; border:1px solid ${tc.accent}44; border-radius:12px; padding:12px 16px; font-size:13px; font-style:italic; opacity:0.8; margin-top:8px;">✨ ${e.ai_poem}</div>` : ''}
          </div>
        `).join('')}
        <div style="text-align:center; margin-top:40px; padding-top:20px; border-top:1px solid ${tc.accent}33; font-size:12px; opacity:0.4;">
          Made with 💛 by SlamSpace • AI-Powered Nostalgia Engine
        </div>
      `

      document.body.appendChild(container)

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: tc.bg,
        logging: false,
      })

      document.body.removeChild(container)

      // Split canvas into A4 pages
      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const imgW = contentW
      const imgH = (canvas.height * contentW) / canvas.width
      const a4H = pageH - margin * 2

      let yPos = 0
      let pageCount = 0

      while (yPos < imgH) {
        if (pageCount > 0) doc.addPage()
        doc.addImage(imgData, 'JPEG', margin, margin, imgW, imgH, undefined, 'FAST', 0)
        doc.setPage(pageCount + 1)
        // Clip to A4 page height using white rectangles
        if (yPos + a4H < imgH) {
          doc.setFillColor(tc.bg)
          doc.rect(0, margin + a4H, pageW, pageH, 'F')
          doc.rect(0, 0, pageW, margin, 'F')
        }
        yPos += a4H
        pageCount++
        if (pageCount > 20) break // safety limit
      }

      doc.save(`SlamSpace-${theme}-${Date.now()}.pdf`)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('PDF export failed. Please try again.')
    }
    setGenerating(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={generating || entries.length === 0}
      className={`flex items-center gap-2 text-sm font-grotesk font-medium px-4 py-2 rounded-xl border transition
        ${done
          ? 'bg-green-100 border-green-300 text-green-700'
          : 'bg-white/60 border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {generating ? (
        <>
          <span className="inline-block animate-spin">⚙️</span>
          Generating PDF...
        </>
      ) : done ? (
        <>✅ PDF Downloaded!</>
      ) : (
        <>📄 Export Scrapbook PDF</>
      )}
    </button>
  )
}
