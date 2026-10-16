import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { FONT_MONO } from '../theme';
import type { FarmWithOwner } from '../api/client';
import { farmCenter } from './FarmsMap';

export type SortKey = 'name' | 'owner' | 'size' | 'points' | 'created';
export type SortDir = 'asc' | 'desc';
export type TypeFilter = 'all' | 'mapped' | 'pins';

const SORT_KEYS: SortKey[] = ['name', 'owner', 'size', 'points', 'created'];
const PAGE_SIZES = [25, 50, 100];
const isMapped = (f: FarmWithOwner) => f.boundary.length >= 3;

/** Every search word must match somewhere in the farm's name, owner, email, size or type. */
export function filterFarms(farms: FarmWithOwner[], query: string, type: TypeFilter): FarmWithOwner[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return farms.filter((f) => {
    if (type === 'mapped' && !isMapped(f)) return false;
    if (type === 'pins' && isMapped(f)) return false;
    if (!words.length) return true;
    const haystack = [f.name, f.owner?.name, f.owner?.email, f.sizeHectares ? `${f.sizeHectares} ha` : '', isMapped(f) ? 'boundary polygon' : 'pin']
      .join(' ')
      .toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

const text = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

export function sortFarms(farms: FarmWithOwner[], key: SortKey, dir: SortDir): FarmWithOwner[] {
  const sign = dir === 'asc' ? 1 : -1;
  const value = (f: FarmWithOwner): number | string | null => {
    switch (key) {
      case 'name':
        return f.name;
      case 'owner':
        return f.owner?.name ?? '';
      case 'size':
        return f.sizeHectares ?? null;
      case 'points':
        return f.boundary.length;
      case 'created':
        return new Date(f.createdAt).getTime();
    }
  };
  return [...farms].sort((a, b) => {
    const x = value(a);
    const y = value(b);
    // Farms with no value (for example no recorded size) always go last.
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    const order = typeof x === 'string' ? text(x, y as string) : (x as number) - (y as number);
    return order * sign || text(a.name, b.name);
  });
}

function readParams(params: URLSearchParams) {
  const sort = params.get('sort') as SortKey;
  const type = params.get('type') as TypeFilter;
  return {
    q: params.get('q') ?? '',
    sort: SORT_KEYS.includes(sort) ? sort : ('created' as SortKey),
    dir: (params.get('dir') === 'asc' ? 'asc' : 'desc') as SortDir,
    type: type === 'mapped' || type === 'pins' ? type : ('all' as TypeFilter),
  };
}

export function FarmsTable({ farms, onLocate }: { farms: FarmWithOwner[]; onLocate: (farm: FarmWithOwner) => void }) {
  // Search, sort and filter live in the URL, so a view can be bookmarked or shared.
  const [params, setParams] = useSearchParams();
  const { q, sort, dir, type } = readParams(params);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZES[0]);

  // The box is driven by local state so typing is instant; the URL follows a moment later
  // (the router applies URL changes with a delay, which would drop fast keystrokes).
  const [input, setInput] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef(false);
  useEffect(() => {
    if (!pending.current) setInput(q); // back/forward or an edited link
  }, [q]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
    setPage(0);
  };

  const search = (value: string) => {
    setInput(value);
    setPage(0);
    pending.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pending.current = false;
      update({ q: value });
    }, 300);
  };
  const clearSearch = (extra: Record<string, string | null> = {}) => {
    clearTimeout(timer.current);
    pending.current = false;
    setInput('');
    update({ q: null, ...extra });
  };

  const matching = useMemo(() => filterFarms(farms, input, type), [farms, input, type]);
  const rows = useMemo(() => sortFarms(matching, sort, dir), [matching, sort, dir]);
  const counts = useMemo(
    () => ({
      all: filterFarms(farms, input, 'all').length,
      mapped: filterFarms(farms, input, 'mapped').length,
      pins: filterFarms(farms, input, 'pins').length,
    }),
    [farms, input],
  );
  const safePage = Math.min(page, Math.max(0, Math.ceil(rows.length / rowsPerPage) - 1));
  const visible = rows.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage);

  const header = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => (
    <TableCell align={align} sortDirection={sort === key ? dir : false}>
      <TableSortLabel
        active={sort === key}
        direction={sort === key ? dir : 'asc'}
        onClick={() =>
          update(
            sort === key
              ? { dir: dir === 'asc' ? 'desc' : 'asc' }
              : // Text columns start A to Z; size, boundary and date start with the biggest or newest.
                { sort: key, dir: key === 'name' || key === 'owner' ? 'asc' : 'desc' },
          )
        }
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  if (!farms.length) return <Alert severity="info">No farms registered yet.</Alert>;

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search farm, owner, email or size"
          value={input}
          onChange={(e) => search(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 360 } }}
          slotProps={{
            htmlInput: { 'aria-label': 'Search farms' },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: input ? (
                <InputAdornment position="end">
                  <IconButton size="small" aria-label="Clear search" onClick={() => clearSearch()}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : undefined,
            },
          }}
        />
        <ToggleButtonGroup size="small" exclusive value={type} onChange={(_, v: TypeFilter | null) => v && update({ type: v === 'all' ? null : v })} aria-label="Farm type">
          <ToggleButton value="all">All ({counts.all.toLocaleString()})</ToggleButton>
          <ToggleButton value="mapped">Boundary ({counts.mapped.toLocaleString()})</ToggleButton>
          <ToggleButton value="pins">Pin ({counts.pins.toLocaleString()})</ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {rows.length === farms.length ? `${farms.length.toLocaleString()} farms` : `${rows.length.toLocaleString()} of ${farms.length.toLocaleString()} farms`}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {header('name', 'Farm')}
              {header('owner', 'Owner')}
              {header('size', 'Size', 'right')}
              {header('points', 'Boundary')}
              <TableCell>Centre (lat, lng)</TableCell>
              {header('created', 'Registered')}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map((farm) => {
              const c = farmCenter(farm);
              return (
                <TableRow key={farm.id} hover sx={{ cursor: 'pointer' }} onClick={() => onLocate(farm)}>
                  <TableCell sx={{ fontWeight: 600 }}>{farm.name}</TableCell>
                  <TableCell>
                    {farm.owner?.name ?? 'Unknown'}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {farm.owner?.email}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: FONT_MONO }}>
                    {farm.sizeHectares ? `${farm.sizeHectares} ha` : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={isMapped(farm) ? 'secondary' : 'default'} variant="outlined" label={isMapped(farm) ? `polygon · ${farm.boundary.length} pts` : 'pin'} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>
                    {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>{new Date(farm.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })}
            {!visible.length ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No farms match.{' '}
                  {input || type !== 'all' ? (
                    <Box component="span" role="button" tabIndex={0} sx={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => clearSearch({ type: null })} onKeyDown={(e) => e.key === 'Enter' && clearSearch({ type: null })}>
                      Clear filters
                    </Box>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={rows.length}
          page={safePage}
          onPageChange={(_, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={PAGE_SIZES}
        />
      </TableContainer>
    </>
  );
}
