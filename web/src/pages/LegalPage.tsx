import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { usePageTitle } from '../hooks/usePageTitle';
import { LEGAL_DOCS, LEGAL_UPDATED, SUPPORT_EMAIL } from '../legal/content';

function PublicPage({ title, children }: { title: string; children: React.ReactNode }) {
  usePageTitle(title);

  return (
    <Container component="main" maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="overline" color="text.secondary">
        Dyp Farms Coffee
      </Typography>
      <Typography variant="h3" component="h1" gutterBottom>
        {title}
      </Typography>
      {children}
      <Box component="footer" sx={{ mt: 6, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/delete-account">Delete your account</Link>
      </Box>
    </Container>
  );
}

export function LegalPage({ doc }: { doc: 'privacy' | 'terms' }) {
  const content = LEGAL_DOCS[doc];
  return (
    <PublicPage title={content.title}>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Last updated {LEGAL_UPDATED}
      </Typography>
      <Typography sx={{ mb: 3 }}>{content.intro}</Typography>
      {content.sections.map((section) => (
        <Box key={section.heading} sx={{ mb: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {section.heading}
          </Typography>
          {section.body.map((paragraph) => (
            <Typography key={paragraph} sx={{ mb: 1 }}>
              {paragraph}
            </Typography>
          ))}
        </Box>
      ))}
    </PublicPage>
  );
}

export function DeleteAccountInfoPage() {
  return (
    <PublicPage title="Delete your account">
      <Typography sx={{ mb: 2 }}>
        You can delete your Dyp Farms Coffee account and personal data at any time.
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom>
        In the app
      </Typography>
      <Typography component="ol" sx={{ pl: 3, mb: 3 }}>
        <li>Open the app and sign in.</li>
        <li>Go to Profile, then Security, then Delete account.</li>
        <li>Enter your password and confirm.</li>
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom>
        What is deleted and what is kept
      </Typography>
      <Typography sx={{ mb: 3 }}>
        Your profile, sign-in details, farms and boundaries, notifications and support tickets are
        permanently removed. Payment, booking and order records are kept without your personal
        details, because we must keep financial records.
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom>
        Cannot sign in?
      </Typography>
      <Typography>
        Email <Link href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</Link> from your registered
        address and ask us to delete your account.
      </Typography>
    </PublicPage>
  );
}
