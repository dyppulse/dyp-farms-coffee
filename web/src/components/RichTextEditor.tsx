// Tiptap (MIT) — headless ProseMirror editor, so the toolbar and styling are our own MUI.
// Only the formatting the server allowlist keeps (backend/src/tickets/rich-text.ts) is enabled.
import { useEffect, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/Link';
import FormatClearIcon from '@mui/icons-material/FormatClear';
import { alpha, useTheme } from '@mui/material/styles';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: number;
}

function withProtocol(url: string) {
  const v = url.trim();
  if (!v) return '';
  return /^(https?:|mailto:)/i.test(v) ? v : `https://${v}`;
}

function Toolbar({ editor }: { editor: Editor }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [url, setUrl] = useState('');

  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      link: e.isActive('link'),
    }),
  });

  const buttons: { label: string; icon: React.ReactNode; on: boolean; run: () => void }[] = [
    { label: 'Bold', icon: <FormatBoldIcon />, on: active.bold, run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: <FormatItalicIcon />, on: active.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Underline', icon: <FormatUnderlinedIcon />, on: active.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { label: 'Bulleted list', icon: <FormatListBulletedIcon />, on: active.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Numbered list', icon: <FormatListNumberedIcon />, on: active.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: 'Quote', icon: <FormatQuoteIcon />, on: active.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
  ];

  function applyLink() {
    const href = withProtocol(url);
    if (href) editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    else editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setAnchor(null);
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        px: 1,
        py: 0.75,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: (t) => alpha(t.palette.text.primary, 0.05),
        '& .MuiIconButton-root': { border: 'none', bgcolor: 'transparent', width: 34, height: 34, borderRadius: 2 },
        '& .MuiSvgIcon-root': { fontSize: 20 },
      }}
    >
      {buttons.map((b) => (
        <Tooltip key={b.label} title={b.label}>
          <IconButton
            aria-label={b.label}
            aria-pressed={b.on}
            onMouseDown={(e) => e.preventDefault()} // keep the editor selection
            onClick={b.run}
            sx={b.on ? { bgcolor: (t) => `${alpha(t.palette.primary.main, 0.2)} !important`, color: 'primary.main' } : undefined}
          >
            {b.icon}
          </IconButton>
        </Tooltip>
      ))}
      <Tooltip title="Link">
        <IconButton
          aria-label="Link"
          aria-pressed={active.link}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            setUrl((editor.getAttributes('link').href as string | undefined) ?? '');
            setAnchor(e.currentTarget);
          }}
          sx={active.link ? { bgcolor: (t) => `${alpha(t.palette.primary.main, 0.2)} !important`, color: 'primary.main' } : undefined}
        >
          <LinkIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Clear formatting">
        <IconButton
          aria-label="Clear formatting"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <FormatClearIcon />
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 1.5, display: 'flex', gap: 1, mt: 0.5 } } }}
      >
        <TextField
          autoFocus
          size="small"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyLink();
            }
          }}
          sx={{ width: 240 }}
        />
        <Button variant="contained" size="small" onClick={applyLink}>
          {url.trim() ? 'Apply' : 'Remove'}
        </Button>
      </Popover>
    </Box>
  );
}

export default function RichTextEditor({ value, onChange, placeholder, height = 220 }: Props) {
  const { palette } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } },
      }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });

  // Parent cleared the field (e.g. after sending) — reset the editor to match.
  useEffect(() => {
    if (editor && value === '' && !editor.isEmpty) editor.commands.clearContent();
  }, [value, editor]);

  return (
    <Box
      sx={{
        borderRadius: 3.5,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
        '&:focus-within': { borderColor: 'primary.main' },
        '& .tiptap': {
          minHeight: height - 52,
          maxHeight: 420,
          overflowY: 'auto',
          p: 2,
          outline: 'none',
          fontSize: 14,
          lineHeight: 1.7,
          color: 'text.primary',
          '& > :first-of-type': { mt: 0 },
          '& > :last-child': { mb: 0 },
          '& p': { my: 1 },
          '& ul, & ol': { my: 1, pl: 3 },
          '& a': { color: palette.primary.main, textDecoration: 'underline' },
          '& blockquote': { m: 0, my: 1, pl: 1.5, borderLeft: `3px solid ${palette.divider}`, color: palette.text.secondary },
          '& code': { fontFamily: 'ui-monospace, monospace', fontSize: '0.9em' },
          // Placeholder (from the Placeholder extension) in the theme's muted colour.
          '& p.is-editor-empty:first-of-type::before': {
            content: 'attr(data-placeholder)',
            color: palette.text.secondary,
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
        },
      }}
    >
      {editor ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} />
    </Box>
  );
}
