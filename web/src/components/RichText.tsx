import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import Box from '@mui/material/Box';

const LOOKS_LIKE_HTML = /<\/?[a-z][\s\S]*>/i;

// Keep in sync with the server allowlist in backend/src/tickets/rich-text.ts.
const ALLOWED_TAGS = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre'];

let hooked = false;
function ensureLinkHook() {
  if (hooked) return;
  hooked = true;
  // Links from user content must never be able to reach back into this window.
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/** Visible text of a message — HTML or plain — for table previews and emptiness checks. */
export function plainText(body: string): string {
  if (!LOOKS_LIKE_HTML.test(body)) return body;
  const doc = new DOMParser().parseFromString(body.replace(/<\/(p|li|blockquote)>/gi, ' </$1>'), 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** Renders ticket text. HTML is sanitised again on the client (defence in depth); text
 * without tags — older tickets, the mobile app — renders as plain pre-wrapped text. */
export function RichText({ html }: { html: string }) {
  const clean = useMemo(() => {
    if (!LOOKS_LIKE_HTML.test(html)) return null;
    ensureLinkHook();
    return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: ['href', 'target', 'rel'] });
  }, [html]);

  if (clean === null) {
    return (
      <Box component="span" sx={{ whiteSpace: 'pre-wrap' }}>
        {html}
      </Box>
    );
  }
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: clean }}
      sx={{
        lineHeight: 1.7,
        wordBreak: 'break-word',
        '& > :first-child': { mt: 0 },
        '& > :last-child': { mb: 0 },
        '& p': { my: 1 },
        '& ul, & ol': { my: 1, pl: 3 },
        '& a': { color: 'primary.main' },
        '& blockquote': { m: 0, my: 1, pl: 1.5, borderLeft: 3, borderColor: 'divider', color: 'text.secondary' },
        '& code, & pre': { fontFamily: 'ui-monospace, monospace', fontSize: '0.9em' },
      }}
    />
  );
}
