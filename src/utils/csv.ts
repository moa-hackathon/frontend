export interface CsvResponses {
  headers: string[]
  rows: string[][]
}

/** Comma-separated Google Forms export, including quoted commas/newlines. */
export function parseResponsesCsv(source: string): CsvResponses {
  const text = source.replace(/^\uFEFF/, '')
  const records: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let closedQuote = false

  const finishField = () => {
    row.push(field)
    field = ''
    closedQuote = false
  }
  const finishRow = () => {
    finishField()
    if (row.some((cell) => cell.trim() !== '')) records.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else { quoted = false; closedQuote = true }
      } else field += char
    } else if (char === ',') finishField()
    else if (char === '\r' || char === '\n') {
      finishRow()
      if (char === '\r' && text[i + 1] === '\n') i++
    } else if (char === '"') {
      if (field !== '' || closedQuote) throw new Error('CSV의 따옴표 형식을 확인해 주세요.')
      quoted = true
    } else {
      if (closedQuote) throw new Error('CSV의 따옴표 뒤에 잘못된 문자가 있어요.')
      field += char
    }
  }
  if (quoted) throw new Error('CSV의 따옴표가 닫히지 않았어요.')
  finishRow()

  const headers = records.shift()?.map((header) => header.trim())
  if (!headers || headers.length < 2 || headers.some((header) => !header)) {
    throw new Error('첫 줄에 항목명이 있는 구글폼 응답 CSV를 선택해 주세요.')
  }
  if (new Set(headers).size !== headers.length) throw new Error('중복된 항목명이 있어요. CSV 첫 줄을 확인해 주세요.')
  if (records.length === 0) throw new Error('신청 응답이 없는 CSV예요.')
  if (records.some((record) => record.length !== headers.length)) {
    throw new Error('항목 수가 다른 응답이 있어요. CSV 파일을 확인해 주세요.')
  }
  return { headers, rows: records }
}

export async function readResponsesCsv(file: File): Promise<CsvResponses> {
  if (!/\.csv$/i.test(file.name)) throw new Error('CSV 파일만 불러올 수 있어요.')
  if (file.size > 10 * 1024 * 1024) throw new Error('10MB 이하의 CSV 파일을 선택해 주세요.')
  const buffer = await file.arrayBuffer()
  let text: string
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer) }
  catch { text = new TextDecoder('euc-kr', { fatal: true }).decode(buffer) }
  return parseResponsesCsv(text)
}
