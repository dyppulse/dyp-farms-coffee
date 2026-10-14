import { api } from '../../api/client';

export type DashData = Awaited<ReturnType<typeof api.dashboard.get>>;
