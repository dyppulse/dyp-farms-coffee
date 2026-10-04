import { BadRequestException } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

const LOOKS_LIKE_HTML = /<\/?[a-z][\s\S]*>/i;

/** Tags the web editor can produce. Everything else (scripts, iframes, styles, event
 * handlers, images…) is dropped. Keep in sync with the allowlist in web/src/components/RichText.tsx. */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
  },
};

/** Rich text from the web editor is sanitised HTML; plain text (e.g. from the mobile app)
 * is stored untouched so it isn't entity-encoded. Rejects bodies with no visible text. */
export function cleanBody(raw: string): string {
  const value = raw.trim();
  const out = LOOKS_LIKE_HTML.test(value) ? sanitizeHtml(value, OPTIONS).trim() : value;
  const visible = sanitizeHtml(out, { allowedTags: [], allowedAttributes: {} }).replace(/&nbsp;|\s/g, '');
  if (!visible) throw new BadRequestException('Message cannot be empty');
  return out;
}
