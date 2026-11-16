import { docxTables, xlsxRows, sharedStrings, csvRows, pdfLinesToRows } from './yearplan';
/** Read a yearly plan file on the device into rows of cells: Word (.docx), Excel (.xlsx), CSV or PDF with a text layer. */
export async function readPlanFile(file: File): Promise<{ rows: string[][]; kind: string }> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) return { rows: csvRows(await file.text()), kind: 'CSV' };
  if (name.endsWith('.docx') || name.endsWith('.xlsx')) {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    if (name.endsWith('.docx')) { const xml = await zip.file('word/document.xml')?.async('string'); if (!xml) throw new Error('This Word file has no document inside.'); return { rows: docxTables(xml), kind: 'Word' }; }
    const shared = sharedStrings((await zip.file('xl/sharedStrings.xml')?.async('string')) ?? '');
    const sheets = Object.keys(zip.files).filter((f) => /^xl\/worksheets\/sheet\d+\.xml$/.test(f)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
    const rows: string[][] = [];
    for (const s of sheets) rows.push(...xlsxRows(await zip.file(s)!.async('string'), shared));
    return { rows, kind: 'Excel' };
  }
  if (name.endsWith('.pdf')) {
    const { openPdf } = await import('./textbook/pdf');
    const doc = await openPdf(file);
    const rows: string[][] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const tc = await (await doc.getPage(i)).getTextContent();
      rows.push(...pdfLinesToRows(tc.items.filter((x) => 'str' in x).map((x) => { const it = x as { str: string; transform: number[]; width: number }; return { str: it.str, x: it.transform[4], y: it.transform[5], w: it.width }; })));
    }
    if (!rows.some((r) => r.join('').trim())) throw new Error('This PDF is a scan without text. Save the plan from Word or Excel instead, or build it from the Scheme of Work.');
    return { rows, kind: 'PDF' };
  }
  if (name.endsWith('.doc') || name.endsWith('.xls')) throw new Error('This is an old Word or Excel format. Open it and use "Save as" .docx or .xlsx, then upload again.');
  throw new Error('Choose a Word (.docx), Excel (.xlsx), CSV or PDF file.');
}
