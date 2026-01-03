import {
  assertEquals
} from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  processNewActivity,
  processDeletedActivity,
  refreshToken
} from '../index.ts';

function createSupabaseMocks() {
  const upserts: any[] = [];
  const deletes: any[] = [];
  const updates: any[] = [];

  return {
    client: {
      from(table: string) {
        if (table === 'activities') {
          return {
            upsert: (payload: any) => {
              upserts.push(payload);
              return Promise.resolve({ error: null });
            },
            delete: () => ({
              eq: () => ({
                eq: (column: string, value: unknown) => {
                  deletes.push({ column, value });
                  return Promise.resolve({ error: null });
                }
              })
            })
          };
        }

        if (table === 'users') {
          return {
            update: (payload: any) => ({
              eq: (column: string, value: unknown) => {
                updates.push({ payload, column, value });
                return Promise.resolve({ error: null });
              }
            })
          };
        }

        throw new Error(`Unhandled table ${table}`);
      }
    },
    upserts,
    deletes,
    updates
  };
}

Deno.test('processNewActivity stores fetched activity', async () => {
  const mocks = createSupabaseMocks();
  globalThis.fetch = async () =>
    ({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Demo',
        type: 'Run',
        sport_type: 'Run',
        start_date: '2024-06-01',
        start_date_local: '2024-06-01',
        distance: 1000,
        moving_time: 600,
        elapsed_time: 650,
        total_elevation_gain: 10,
        average_speed: 2,
        max_speed: 3,
        average_heartrate: 150,
        max_heartrate: 170,
        kudos_count: 0,
        achievement_count: 0
      })
    } as Response);

  await processNewActivity(
    mocks.client,
    {
      id: 'user',
      access_token: 'token',
      refresh_token: 'refresh',
      token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
    },
    123
  );

  assertEquals(mocks.upserts.length, 1);
});

Deno.test('processDeletedActivity removes row', async () => {
  const mocks = createSupabaseMocks();
  await processDeletedActivity(mocks.client, 'user', 1);
  assertEquals(mocks.deletes.length, 1);
});

Deno.test('refreshToken updates credentials', async () => {
  const mocks = createSupabaseMocks();
  globalThis.fetch = async () =>
    ({
      ok: true,
      json: async () => ({
        access_token: 'new',
        refresh_token: 'new-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      })
    } as Response);

  const token = await refreshToken(mocks.client, {
    id: 'user',
    refresh_token: 'old'
  });

  assertEquals(token, 'new');
  assertEquals(mocks.updates.length, 1);
});
