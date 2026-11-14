export function validateFormUrl(value: string): string {
  try {
    const url = new URL(value.trim())
    const isShortLink = url.hostname === 'forms.gle' && url.pathname.length > 1
    const isFullLink = url.hostname === 'docs.google.com' && /^\/forms\/(?:u\/\d+\/)?d\/(?:e\/)?[^/]+\/(?:viewform|edit)\/?$/.test(url.pathname)
    if (url.protocol !== 'https:' || url.username || url.password || url.port || (!isShortLink && !isFullLink)) throw new Error()
    return url.href
  } catch {
    throw new Error('https://forms.gle/... 또는 구글폼 링크를 입력해 주세요.')
  }
}

