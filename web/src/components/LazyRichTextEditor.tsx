import { Suspense, lazy } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';

// TinyMCE is large; only pages that actually show an editor pay for it.
const RichTextEditor = lazy(() => import('./RichTextEditor'));

export function RichEditor(props: { value: string; onChange: (html: string) => void; placeholder?: string; height?: number }) {
  return (
    <Suspense
      fallback={
        <Box>
          <Skeleton variant="rounded" height={props.height ?? 220} />
        </Box>
      }
    >
      <RichTextEditor {...props} />
    </Suspense>
  );
}
