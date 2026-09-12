import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { api, type Auction } from '../api/client';

export function AuctionDetailPage() {
  const { lotId } = useParams<{ lotId: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!lotId) return;
    return api.auctions.get(lotId).then(setAuction);
  }, [lotId]);

  useEffect(() => {
    setLoading(true);
    load()?.finally(() => setLoading(false));
  }, [load]);

  async function placeBid() {
    if (!lotId) return;
    const value = Number(amount);
    if (!value || value <= 0) {
      setError('Enter a valid bid amount.');
      return;
    }
    setError(null);
    setSuccess(null);
    setBidding(true);
    try {
      await api.auctions.bid(lotId, value);
      setAmount('');
      setSuccess('Bid placed!');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not place bid.');
    } finally {
      setBidding(false);
    }
  }

  if (loading) return <CircularProgress />;
  if (!auction) return <Typography color="text.secondary">Auction not found.</Typography>;

  const lot = auction.lot;

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h5" sx={{ fontWeight: 800 }} gutterBottom>
        {lot?.name ?? 'Lot'}
      </Typography>
      {lot ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {lot.origin} · Lot #{lot.lotNumber} · {lot.quantity} {lot.unit} · Traceability: {lot.traceability}
        </Typography>
      ) : null}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current bid
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800 }} color="primary.main">
                ${auction.currentBid.toFixed(2)}
              </Typography>
            </Box>
            <Chip
              label={auction.status === 'active' ? 'Live' : 'Ended'}
              color={auction.status === 'active' ? 'success' : 'default'}
            />
          </Box>

          {auction.status === 'active' ? (
            <>
              {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : null}
              {success ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              ) : null}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Your bid ($/kg)"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && placeBid()}
                  sx={{ flex: 1 }}
                />
                <Button variant="contained" onClick={placeBid} disabled={bidding}>
                  Place Bid
                </Button>
              </Box>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Typography variant="subtitle1" sx={{ fontWeight: 700 }} gutterBottom>
        Bid history
      </Typography>
      <Divider sx={{ mb: 1 }} />
      <List dense>
        {auction.bids.map((bid) => (
          <ListItem key={bid.id}>
            <ListItemText
              primary={`${bid.bidderName} — $${bid.amount.toFixed(2)}`}
              secondary={new Date(bid.createdAt).toLocaleString()}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
