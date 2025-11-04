import sanitizeHtml from 'sanitize-html'

export const sanitize = (dirty) =>
  sanitizeHtml(dirty, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'p', 'br'],
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
    },
    // запрещаем javascript:-ссылки
    allowedSchemesByTag: { a: ['http', 'https', 'mailto'] },
  })
