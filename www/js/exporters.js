(function (root) {
  'use strict';
  const C = root.FarnavaCore;
  function downloadBlob(blob, filename) {
    if (root.FarnavaNative && typeof root.FarnavaNative.saveFile === 'function') {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = String(reader.result).split(',')[1] || '';
        root.FarnavaNative.saveFile(filename, blob.type || 'application/octet-stream', base64);
      };
      reader.readAsDataURL(blob);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function invoiceHtml(invoice, state) {
    const t = C.calculateInvoice(invoice);
    const b = state.business;
    const rows = t.lines.map((item, i) => `<tr><td>${i + 1}</td><td>${C.escapeHtml(item.name)}</td><td>${C.escapeHtml(item.unit || 'عدد')}</td><td>${C.formatNumber(item.quantity)}</td><td>${C.formatNumber(item.unitPrice)}</td><td>${C.formatNumber(item.lineDiscount)}</td><td>${C.formatNumber(item.net)}</td></tr>`).join('');
    const typeName = ({ sale: 'فاکتور فروش', purchase: 'فاکتور خرید', quote: 'پیش‌فاکتور', receipt: 'رسید' })[invoice.type] || 'فاکتور';
    return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>${typeName} ${C.escapeHtml(invoice.number)}</title><style>
      @font-face{font-family:Abar;src:url('fonts/abar-regular.ttf')}@font-face{font-family:Anjoman;src:url('fonts/anjoman-black.ttf')}
      *{box-sizing:border-box}body{font-family:Abar,Tahoma,sans-serif;color:#172b3e;margin:0;padding:28px;background:#fff;font-size:12px}h1,h2,p{margin:0} .sheet{max-width:900px;margin:auto}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #142d46;padding-bottom:18px}.brand{font:24px Anjoman;color:#142d46;direction:ltr}.muted{color:#718197;font-size:10px;margin-top:5px}.tag{background:#eaf5f3;color:#147d72;padding:8px 14px;border-radius:9px}.meta{display:flex;justify-content:space-between;gap:20px;margin:22px 0}.panel{border:1px solid #e3eaf0;border-radius:10px;padding:12px;flex:1;line-height:2}.panel h2{font-size:13px;margin-bottom:6px;color:#142d46}.table{width:100%;border-collapse:collapse;margin-top:12px}.table th{background:#142d46;color:#fff;font-weight:normal}.table th,.table td{padding:10px 8px;border:1px solid #e4eaf0;text-align:right}.table td:first-child,.table th:first-child{text-align:center}.totals{width:330px;margin:18px 0 0 auto;border:1px solid #e3eaf0;border-radius:10px;padding:12px}.total-row{display:flex;justify-content:space-between;padding:5px 0}.grand{border-top:1px solid #dbe4eb;margin-top:7px;padding-top:10px;font-weight:bold;color:#087f72;font-size:15px}.notes{margin-top:20px;padding:12px;background:#f6f8fa;border-radius:8px;line-height:1.9}.sign{display:flex;justify-content:space-between;margin-top:42px;color:#718197}.sign div{width:35%;border-top:1px dashed #aab7c4;padding-top:8px;text-align:center}@media print{body{padding:0}.sheet{max-width:none}}
    </style></head><body><main class="sheet"><header class="head"><div><div class="brand">FARNAVA</div><div class="muted">${C.escapeHtml(b.name || 'کسب‌وکار من')}</div><div class="muted">${C.escapeHtml(b.phone || '')} ${b.address ? ' · ' + C.escapeHtml(b.address) : ''}</div></div><div style="text-align:left"><div class="tag">${typeName}</div><div class="muted">شماره: ${C.escapeHtml(invoice.number)}</div><div class="muted">تاریخ: ${C.formatDate(invoice.date)}</div></div></header>
    <section class="meta"><div class="panel"><h2>مشخصات مشتری</h2><div>${C.escapeHtml(invoice.customerName || 'مشتری نقدی')}</div><div>${C.escapeHtml(invoice.customerPhone || '')}</div><div>${C.escapeHtml(invoice.customerAddress || '')}</div></div><div class="panel"><h2>مشخصات سند</h2><div>تاریخ سررسید: ${C.formatDate(invoice.dueDate)}</div><div>وضعیت: ${invoice.status === 'paid' ? 'تسویه‌شده' : invoice.status === 'partial' ? 'پرداخت بخشی' : 'پرداخت‌نشده'}</div><div>واحد پول: ${C.escapeHtml(b.currency || 'تومان')}</div></div></section>
    <table class="table"><thead><tr><th>ردیف</th><th>شرح کالا / خدمات</th><th>واحد</th><th>تعداد</th><th>قیمت واحد</th><th>تخفیف</th><th>مبلغ</th></tr></thead><tbody>${rows || '<tr><td colspan="7">موردی ثبت نشده است</td></tr>'}</tbody></table>
    <section class="totals"><div class="total-row"><span>جمع جزء</span><b>${C.formatNumber(t.subtotal)}</b></div><div class="total-row"><span>تخفیف اقلام</span><b>${C.formatNumber(t.itemDiscount)}</b></div><div class="total-row"><span>تخفیف فاکتور</span><b>${C.formatNumber(t.invoiceDiscount)}</b></div><div class="total-row"><span>هزینه حمل و سایر</span><b>${C.formatNumber(t.shipping + t.otherFees)}</b></div><div class="total-row"><span>مالیات (${C.formatNumber(t.taxRate)}٪)</span><b>${C.formatNumber(t.tax)}</b></div><div class="total-row grand"><span>مبلغ نهایی (${C.escapeHtml(b.currency || 'تومان')})</span><b>${C.formatNumber(t.total)}</b></div><div class="total-row"><span>پرداخت‌شده</span><b>${C.formatNumber(t.paid)}</b></div><div class="total-row"><span>مانده</span><b>${C.formatNumber(t.balance)}</b></div></section>
    ${invoice.notes ? `<div class="notes"><b>توضیحات:</b> ${C.escapeHtml(invoice.notes)}</div>` : ''}<footer class="sign"><div>مهر و امضای فروشنده</div><div>مهر و امضای خریدار</div></footer></main></body></html>`;
  }
  function printInvoice(invoice, state) {
    const html = invoiceHtml(invoice, state);
    if (root.FarnavaNative && typeof root.FarnavaNative.printHtml === 'function') {
      const bytes = new TextEncoder().encode(html);
      let binary = ''; bytes.forEach(b => binary += String.fromCharCode(b));
      root.FarnavaNative.printHtml(btoa(binary));
      return;
    }
    const win = window.open('', '_blank');
    if (!win) { alert('مرورگر اجازه بازشدن پنجره چاپ را نداد.'); return; }
    win.document.open(); win.document.write(html); win.document.close();
    win.onload = () => setTimeout(() => win.print(), 400);
  }
  async function invoiceImage(invoice, state, format = 'png') {
    if (document.fonts?.ready) await document.fonts.ready;
    const t = C.calculateInvoice(invoice);
    const width = 1200, rowHeight = 58, top = 250, bottom = 360;
    const height = top + Math.max(1, t.lines.length) * rowHeight + bottom;
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#142d46'; ctx.fillRect(0, 0, width, 18);
    ctx.direction = 'rtl'; ctx.textAlign = 'right';
    const right = width - 70;
    ctx.fillStyle = '#142d46'; ctx.font = 'bold 44px Anjoman, Abar, sans-serif'; ctx.fillText('FARNAVA', right, 90);
    ctx.font = '28px Abar, sans-serif'; ctx.fillStyle = '#718197'; ctx.fillText(state.business.name || 'کسب‌وکار من', right, 140);
    const typeName = ({ sale: 'فاکتور فروش', purchase: 'فاکتور خرید', quote: 'پیش‌فاکتور', receipt: 'رسید' })[invoice.type] || 'فاکتور';
    ctx.fillStyle = '#0d8d80'; ctx.font = 'bold 30px Abar, sans-serif'; ctx.fillText(typeName, 70, 90);
    ctx.fillStyle = '#718197'; ctx.font = '24px Abar, sans-serif'; ctx.fillText(`شماره: ${invoice.number}`, 70, 135); ctx.fillText(`تاریخ: ${C.formatDate(invoice.date)}`, 70, 175);
    ctx.fillStyle = '#eaf0f4'; ctx.fillRect(55, 205, width - 110, 2);
    ctx.fillStyle = '#142d46'; ctx.font = 'bold 25px Abar, sans-serif'; ctx.fillText('مشتری: ' + (invoice.customerName || 'مشتری نقدی'), right, 245);
    const y0 = top;
    ctx.fillStyle = '#142d46'; ctx.fillRect(55, y0, width - 110, 48);
    const cols = [{ x: 1110, label: 'شرح کالا / خدمات' }, { x: 720, label: 'تعداد' }, { x: 565, label: 'قیمت واحد' }, { x: 365, label: 'تخفیف' }, { x: 170, label: 'مبلغ' }];
    ctx.font = 'bold 21px Abar, sans-serif'; ctx.fillStyle = '#fff'; cols.forEach(c => ctx.fillText(c.label, c.x, y0 + 31));
    t.lines.forEach((item, i) => {
      const y = y0 + 48 + i * rowHeight;
      ctx.fillStyle = i % 2 ? '#f7f9fb' : '#fff'; ctx.fillRect(55, y, width - 110, rowHeight);
      ctx.fillStyle = '#26394c'; ctx.font = '21px Abar, sans-serif';
      ctx.fillText(item.name || '—', 1110, y + 35); ctx.fillText(C.formatNumber(item.quantity), 720, y + 35); ctx.fillText(C.formatNumber(item.unitPrice), 565, y + 35); ctx.fillText(C.formatNumber(item.lineDiscount), 365, y + 35); ctx.fillText(C.formatNumber(item.net), 170, y + 35);
      ctx.fillStyle = '#e5ebf0'; ctx.fillRect(55, y + rowHeight - 1, width - 110, 1);
    });
    const summaryY = y0 + 48 + Math.max(1, t.lines.length) * rowHeight + 35;
    const rows = [['جمع جزء', t.subtotal], ['تخفیف', t.itemDiscount + t.invoiceDiscount], ['هزینه‌های جانبی', t.shipping + t.otherFees], [`مالیات ${C.formatNumber(t.taxRate)}٪`, t.tax], ['مبلغ نهایی', t.total], ['پرداخت‌شده', t.paid], ['مانده', t.balance]];
    ctx.fillStyle = '#f3f7f8'; ctx.fillRect(650, summaryY, 500, rows.length * 43 + 22);
    rows.forEach((r, i) => { const y = summaryY + 34 + i * 43; ctx.fillStyle = i === 4 ? '#087f72' : '#26394c'; ctx.font = i === 4 ? 'bold 25px Abar, sans-serif' : '21px Abar, sans-serif'; ctx.fillText(r[0], 1115, y); ctx.textAlign = 'left'; ctx.fillText(C.formatNumber(r[1]), 685, y); ctx.textAlign = 'right'; });
    if (invoice.notes) { ctx.fillStyle = '#718197'; ctx.font = '20px Abar, sans-serif'; ctx.fillText('توضیحات: ' + invoice.notes, right, summaryY + rows.length * 43 + 65); }
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const blob = await new Promise(resolve => canvas.toBlob(resolve, mime, 0.94));
    if (!blob) throw new Error('ساخت تصویر ناموفق بود.');
    downloadBlob(blob, `Farnava-${invoice.number}.${format === 'jpg' ? 'jpg' : 'png'}`);
  }

  const CRC_TABLE = (() => { const table = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; } return table; })();
  function crc32(bytes) { let crc = 0xffffffff; for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; }
  function zipStore(files) {
    const enc = new TextEncoder(); const locals = []; const centrals = []; let offset = 0;
    for (const [name, content] of Object.entries(files)) {
      const filename = enc.encode(name); const data = typeof content === 'string' ? enc.encode(content) : content; const crc = crc32(data);
      const local = new Uint8Array(30 + filename.length + data.length); const lv = new DataView(local.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(8, 0, true); lv.setUint16(10, 0, true); lv.setUint16(12, 0, true); lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true); lv.setUint16(26, filename.length, true); lv.setUint16(28, 0, true); local.set(filename, 30); local.set(data, 30 + filename.length); locals.push(local);
      const central = new Uint8Array(46 + filename.length); const cv = new DataView(central.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true); cv.setUint16(12, 0, true); cv.setUint16(14, 0, true); cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, filename.length, true); cv.setUint16(30, 0, true); cv.setUint16(32, 0, true); cv.setUint16(34, 0, true); cv.setUint16(36, 0, true); cv.setUint32(38, 0, true); cv.setUint32(42, offset, true); central.set(filename, 46); centrals.push(central);
      offset += local.length;
    }
    const centralSize = centrals.reduce((s, x) => s + x.length, 0); const end = new Uint8Array(22); const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(4, 0, true); ev.setUint16(6, 0, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true); ev.setUint32(12, centralSize, true); ev.setUint32(16, offset, true); ev.setUint16(20, 0, true);
    return new Blob([...locals, ...centrals, end], { type: 'application/zip' });
  }
  function wordRun(text, bold = false) { return `<w:r><w:rPr><w:rFonts w:ascii="Abar High" w:hAnsi="Abar High" w:cs="Abar High"/>${bold ? '<w:b/><w:bCs/>' : ''}<w:rtl/></w:rPr><w:t xml:space="preserve">${C.xmlEscape(text)}</w:t></w:r>`; }
  function wordParagraph(text, bold = false, align = 'right') { return `<w:p><w:pPr><w:bidi/><w:jc w:val="${align}"/></w:pPr>${wordRun(text, bold)}</w:p>`; }
  function exportInvoiceDocx(invoice, state) {
    const t = C.calculateInvoice(invoice); const rows = [];
    rows.push(wordParagraph('FARNAVA | فرنوا', true, 'center'));
    rows.push(wordParagraph(state.business.name || 'کسب‌وکار من', true));
    rows.push(wordParagraph(`فاکتور ${invoice.number} | تاریخ ${C.formatDate(invoice.date)}`, true));
    rows.push(wordParagraph(`مشتری: ${invoice.customerName || 'مشتری نقدی'} | تلفن: ${invoice.customerPhone || '—'}`));
    rows.push(wordParagraph('شرح اقلام', true));
    t.lines.forEach((item, i) => rows.push(wordParagraph(`${i + 1}. ${item.name} | تعداد: ${C.formatNumber(item.quantity)} | قیمت واحد: ${C.formatNumber(item.unitPrice)} | تخفیف: ${C.formatNumber(item.lineDiscount)} | مبلغ: ${C.formatNumber(item.net)}`)));
    rows.push(wordParagraph(`جمع جزء: ${C.formatNumber(t.subtotal)} ${state.business.currency}`));
    rows.push(wordParagraph(`تخفیف: ${C.formatNumber(t.itemDiscount + t.invoiceDiscount)}`));
    rows.push(wordParagraph(`هزینه‌های جانبی: ${C.formatNumber(t.shipping + t.otherFees)}`));
    rows.push(wordParagraph(`مالیات: ${C.formatNumber(t.tax)}`));
    rows.push(wordParagraph(`مبلغ نهایی: ${C.formatNumber(t.total)} ${state.business.currency}`, true));
    rows.push(wordParagraph(`پرداخت‌شده: ${C.formatNumber(t.paid)} | مانده: ${C.formatNumber(t.balance)}`));
    if (invoice.notes) rows.push(wordParagraph(`توضیحات: ${invoice.notes}`));
    rows.push(wordParagraph('امضای فروشنده: ........................................       امضای خریدار: ........................................'));
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${rows.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="850" w:right="850" w:bottom="850" w:left="850"/></w:sectPr></w:body></w:document>`;
    const files = {
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
      'word/document.xml': documentXml
    };
    downloadBlob(zipStore(files), `Farnava-${invoice.number}.docx`);
  }
  function colName(n) { let s = ''; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; }
  function exportInvoicesXlsx(state) {
    const headers = ['شماره فاکتور', 'نوع', 'تاریخ', 'مشتری', 'جمع کل', 'پرداخت‌شده', 'مانده', 'وضعیت'];
    const rows = state.invoices.map(inv => { const t = C.calculateInvoice(inv); return [inv.number, ({ sale: 'فروش', purchase: 'خرید', quote: 'پیش‌فاکتور', receipt: 'رسید' })[inv.type] || inv.type, C.formatDate(inv.date), inv.customerName || '', t.total, t.paid, t.balance, inv.status || '']; });
    const all = [headers, ...rows];
    const sheetRows = all.map((row, ri) => `<row r="${ri + 1}">${row.map((value, ci) => { const ref = `${colName(ci + 1)}${ri + 1}`; if (typeof value === 'number') return `<c r="${ref}" t="n"><v>${value}</v></c>`; return `<c r="${ref}" t="inlineStr"><is><t>${C.xmlEscape(value)}</t></is></c>`; }).join('')}</row>`).join('');
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" rightToLeft="1"/></sheetViews><sheetFormatPr defaultRowHeight="22"/><sheetData>${sheetRows}</sheetData></worksheet>`;
    const files = {
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="فاکتورها" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      'xl/worksheets/sheet1.xml': sheet
    };
    downloadBlob(zipStore(files), 'Farnava-Invoices.xlsx');
  }
  async function encryptJson(data, passphrase) {
    if (!crypto.subtle) throw new Error('رمزنگاری امن در این محیط در دسترس نیست.');
    const enc = new TextEncoder(); const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(data)));
    const bytes = new Uint8Array(4 + salt.length + iv.length + cipher.byteLength); bytes.set([70, 78, 86, 49], 0); bytes.set(salt, 4); bytes.set(iv, 20); bytes.set(new Uint8Array(cipher), 32);
    return new Blob([bytes], { type: 'application/octet-stream' });
  }
  async function decryptJson(buffer, passphrase) {
    if (!crypto.subtle) throw new Error('رمزگشایی امن در این محیط در دسترس نیست.');
    const bytes = new Uint8Array(buffer); if (bytes.length < 48 || String.fromCharCode(...bytes.slice(0, 4)) !== 'FNV1') throw new Error('فرمت فایل رمزنگاری‌شده معتبر نیست.');
    const salt = bytes.slice(4, 20), iv = bytes.slice(20, 32), cipher = bytes.slice(32); const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    return JSON.parse(new TextDecoder().decode(plain));
  }
  root.FarnavaExport = { downloadBlob, invoiceHtml, printInvoice, invoiceImage, exportInvoiceDocx, exportInvoicesXlsx, encryptJson, decryptJson };
})(window);
