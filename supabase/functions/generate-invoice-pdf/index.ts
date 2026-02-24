import { createClient } from '@supabase/supabase-js'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { id } = await req.json()

    if (!id) {
      throw new Error('Invoice ID is required')
    }

    // Initialize Supabase Client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    // Fetch Invoice Data
    const { data: invoice, error } = await supabaseClient
      .from('notas_fiscais')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !invoice) {
      throw new Error('Invoice not found')
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Formatting Helpers
    const formatCurrency = (value: number) => {
      return `R$ ${value
        .toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
    }

    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return 'N/A'
      const [year, month, day] = dateStr.split('T')[0].split('-')
      return `${day}/${month}/${year}`
    }

    // Helper to draw text
    const drawText = (
      text: string,
      x: number,
      y: number,
      options: any = {},
    ) => {
      page.drawText(text, {
        x,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
        ...options,
      })
    }

    let y = height - 50

    // Header
    drawText('NOTA FISCAL', 50, y, { size: 20, font: fontBold })

    // Status Badge
    const status = (invoice.status || 'PENDENTE').toUpperCase()
    let statusColor = rgb(0.5, 0.5, 0.5) // Gray
    if (status === 'PAGO' || status === 'PAID') statusColor = rgb(0, 0.6, 0) // Green
    if (status === 'VENCIDO' || status === 'OVERDUE')
      statusColor = rgb(0.8, 0, 0) // Red

    // Status text aligned right
    const statusWidth = fontBold.widthOfTextAtSize(status, 14)
    page.drawText(status, {
      x: width - 50 - statusWidth,
      y: y,
      size: 14,
      font: fontBold,
      color: statusColor,
    })

    y -= 40
    page.drawLine({
      start: { x: 50, y: y + 10 },
      end: { x: width - 50, y: y + 10 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
    y -= 20

    // Emitter Information
    if (invoice.emitente_nome || invoice.emitente_cnpj) {
      drawText('EMITENTE:', 50, y, { font: fontBold })
      y -= 15

      if (invoice.emitente_nome) {
        drawText(invoice.emitente_nome, 50, y)
        y -= 15
      }
      if (invoice.emitente_cnpj) {
        drawText(`CNPJ: ${invoice.emitente_cnpj}`, 50, y)
        y -= 15
      }
      y -= 10
    }

    // Info Grid
    const col1X = 50
    const col2X = 300

    drawText(`Número:`, col1X, y, { font: fontBold })
    drawText(invoice.numero, col1X + 60, y)

    drawText(`Emissão:`, col2X, y, { font: fontBold })
    drawText(formatDate(invoice.data_emissao), col2X + 80, y)
    y -= 20

    drawText(`Cliente:`, col1X, y, { font: fontBold })
    drawText(invoice.cliente_fornecedor || '-', col1X + 60, y)

    drawText(`Vencimento:`, col2X, y, { font: fontBold })
    drawText(formatDate(invoice.data_vencimento), col2X + 80, y)
    y -= 20

    drawText(`CNPJ/CPF:`, col1X, y, { font: fontBold })
    drawText(invoice.cnpj_cpf || '-', col1X + 60, y)

    drawText(`Valor Total:`, col2X, y, { font: fontBold })
    drawText(formatCurrency(Number(invoice.valor || 0)), col2X + 80, y, {
      font: fontBold,
    })

    y -= 40

    // Items Section
    drawText('DESCRIÇÃO DOS ITENS / SERVIÇOS', 50, y, {
      font: fontBold,
      size: 12,
    })
    y -= 10
    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })
    y -= 20

    // Items List
    const items = Array.isArray(invoice.itens) ? invoice.itens : []

    if (items.length > 0) {
      for (const item of items) {
        const itemText = `• ${String(item)}`
        drawText(itemText, 50, y)
        y -= 15

        // Basic page overflow handling
        if (y < 50) {
          // For this implementation, we just stop drawing if it overflows
          // In a full implementation, we would add a new page
          drawText('... (mais itens)', 50, y)
          break
        }
      }
    } else {
      drawText('Nenhum item registrado.', 50, y, { color: rgb(0.5, 0.5, 0.5) })
    }

    // Footer
    const footerY = 50
    page.drawLine({
      start: { x: 50, y: footerY + 20 },
      end: { x: width - 50, y: footerY + 20 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    })

    const footerText =
      'Documento gerado eletronicamente pelo CRM Engenharia Civil'
    drawText(footerText, 50, footerY, { size: 8, color: rgb(0.6, 0.6, 0.6) })

    const pdfBytes = await pdfDoc.save()

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
