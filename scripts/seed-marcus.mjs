import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const SPEC = {
  email: 'lee.marcus321@gmail.com',
  password: 'Marcus#2026',
  pin: '5319',
  account: '60518327419',
  name: 'Marcus Louis Lee',
  first: 'Marcus',
  middle: 'Louis',
  last: 'Lee',
  dob: '1979-05-17',
  phone: '+13426426478',
  address: '1200 Peachtree St NE',
  city: 'Atlanta',
  state: 'GA',
  zip: '30309',
  country: 'United States',
  checking: 5433333,
  savings: 18000000,
};

async function getOrCreate(email, password, metadata) {
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) throw list.error;
  let u = list.data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase()) || list.data.users.find((x) => x.email?.toLowerCase() === 'marcus.lee@example.com');
  if (!u) {
    const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
    if (created.error) throw created.error;
    u = created.data.user;
    console.log(`Provisioned new account: ${email}`);
  } else {
    const updated = await supabase.auth.admin.updateUserById(u.id, { email, email_confirm: true, user_metadata: metadata });
    if (updated.error) throw updated.error;
    console.log(`Existing account kept as-is (password unchanged): ${email}`);
  }
  return u;
}

const user = await getOrCreate(SPEC.email, SPEC.password, { full_name: SPEC.name, account_number: SPEC.account });

const { error: roleErr } = await supabase.from('user_roles').upsert({ user_id: user.id, role: 'customer' }, { onConflict: 'user_id,role' });
if (roleErr) throw roleErr;

const pin = await supabase.rpc('hash_pin', { _pin: SPEC.pin });
if (pin.error) throw pin.error;

const existingProfile = await supabase.from('profiles').select('pin_hash').eq('id', user.id).maybeSingle();
if (existingProfile.error) throw existingProfile.error;

const { error: profileError } = await supabase.from('profiles').upsert({
  id: user.id, full_name: SPEC.name, first_name: SPEC.first, middle_name: SPEC.middle, last_name: SPEC.last,
  date_of_birth: SPEC.dob, email: SPEC.email, phone: SPEC.phone,
  address: `${SPEC.address}, ${SPEC.city}, ${SPEC.state} ZC ${SPEC.zip}`,
  city: SPEC.city, state: SPEC.state, zip: SPEC.zip, country: SPEC.country,
  marital_status: 'Not specified', occupation: 'Not specified', employer: '', annual_income: 0,
  account_number: SPEC.account, routing_number: '021000021', account_type: 'Everyday Checking', currency: 'USD',
  pin_hash: existingProfile.data?.pin_hash || pin.data,
  status: 'active', email_verified: true, phone_verified: true, kyc_status: 'verified', two_factor_enabled: false,
  withdrawals_suspended: false, opening_balance: 0, checking_balance: SPEC.checking, savings_balance: SPEC.savings,
  loans_balance: 0, btc_balance: 0, btc_deposit_address: `bc1q${user.id.replaceAll('-', '').slice(0, 32)}`,
  card_type: 'Debit', card_network: 'Visa', card_last4: SPEC.account.slice(-4), card_expiry: '09/30',
  opened_date: '2025-01-15',
}, { onConflict: 'id' });
if (profileError) throw profileError;

const ensure = await supabase.rpc('ensure_user_accounts', { _user_id: user.id });
if (ensure.error) throw ensure.error;

const sender = { name: 'Rio Bridge Finance', bank: 'Rio Bridge Finance' };
const rows = [
  { user_id: user.id, type: 'wire', direction: 'credit', account: 'checking', amount: 5476833, currency: 'USD', counterparty: { name: 'Lee Holdings LLC', bank: 'JPMorgan Chase' }, memo: 'Opening deposit', status: 'completed', created_at: '2025-01-15T10:00:00.000Z' },
  { user_id: user.id, type: 'local', direction: 'credit', account: 'savings', amount: 18000000, currency: 'USD', counterparty: { name: 'Lee Holdings LLC', bank: 'JPMorgan Chase' }, memo: 'Savings deposit', status: 'completed', created_at: '2025-01-15T10:30:00.000Z' },
  { user_id: user.id, type: 'wire', direction: 'debit', account: 'checking', amount: 43500, currency: 'USD', counterparty: { name: 'Jessica Lissette Alarcon Lopez', bank: 'Rio Bridge Finance', account: '••••6389' }, memo: 'Transfer to Jessica Alarcon', status: 'completed', created_at: '2026-09-01T09:00:00.000Z' },
];
const { error: clearTx } = await supabase.from('transactions').delete().eq('user_id', user.id);
if (clearTx) throw clearTx;
const { error: txErr } = await supabase.from('transactions').insert(rows);
if (txErr) throw txErr;

const accounts = await supabase.from('user_accounts').select('id,kind').eq('user_id', user.id);
if (accounts.error) throw accounts.error;
const byKind = Object.fromEntries((accounts.data ?? []).map((a) => [a.kind, a.id]));
const { error: acctError } = await supabase.from('user_accounts').upsert([
  { id: byKind.earning, user_id: user.id, kind: 'earning', is_primary: true, currency: 'USD', status: 'active', available_balance: SPEC.checking, pending_balance: 0, held_balance: 0, last_transaction_at: '2026-09-01T09:00:00.000Z' },
  { id: byKind.savings, user_id: user.id, kind: 'savings', is_primary: false, currency: 'USD', status: 'active', available_balance: SPEC.savings, pending_balance: 0, held_balance: 0, last_transaction_at: '2025-01-15T10:30:00.000Z' },
  { id: byKind.investment, user_id: user.id, kind: 'investment', is_primary: false, currency: 'USD', status: 'active', available_balance: 0, pending_balance: 0, held_balance: 0 },
], { onConflict: 'id' });
if (acctError) throw acctError;

await supabase.from('loans').delete().eq('user_id', user.id);
await supabase.from('beneficiaries').delete().eq('user_id', user.id);
await supabase.from('notifications').delete().eq('user_id', user.id);
const { error: notifErr } = await supabase.from('notifications').insert([
  { user_id: user.id, title: 'Transfer sent', body: 'You sent $43,500.00 to Jessica Alarcon.', kind: 'info', link: '/activity', created_at: '2026-09-01T09:00:00.000Z' },
]);
if (notifErr) throw notifErr;

console.log(`Marcus ready: account ${SPEC.account}, checking $${SPEC.checking}, savings $${SPEC.savings}, total $${SPEC.checking + SPEC.savings}`);
