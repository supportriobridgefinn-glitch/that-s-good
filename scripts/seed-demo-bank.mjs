import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
  process.exit(1);
}
const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const ADMIN = { email: 'admin@example.com', password: 'RioAdmin!2026', name: 'Rio Bridge Finance Administrator' };
const USERS = [
  { name: 'Daniel Brooks', first: 'Daniel', last: 'Brooks', email: 'daniel.brooks@example.com', account: '48270193624', password: 'Cedar#2026', pin: '4826', phone: '+1 202 555 0147', city: 'Austin', state: 'Texas', opening: 12000, savings: 18500, investment: 9200 },
  { name: 'Sophia Bennett', first: 'Sophia', last: 'Bennett', email: 'sophia.bennett@example.com', account: '57381462095', password: 'Harbor#2026', pin: '7314', phone: '+1 303 555 0182', city: 'Denver', state: 'Colorado', opening: 16000, savings: 27400, investment: 14500 },
];


function rng(seed) { let x = seed >>> 0; return () => ((x = Math.imul(1664525, x) + 1013904223) >>> 0) / 4294967296; }
function money(v) { return Number(v.toFixed(2)); }
function isoDate(y, m, d) { return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString(); }
function txType(i) { return i % 5 === 0 ? 'wire' : i % 7 === 0 ? 'international' : 'local'; }

async function getOrCreate(email, password, metadata) {
  const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (list.error) throw list.error;
  let u = list.data.users.find((x) => x.email?.toLowerCase() === email.toLowerCase());
  if (!u) {
    const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
    if (created.error) throw created.error;
    u = created.data.user;
    console.log(`Provisioned new account: ${email}`);
  } else {
    // Existing account: never touch the password. Only keep metadata/confirmation in sync.
    const updated = await supabase.auth.admin.updateUserById(u.id, { email_confirm: true, user_metadata: metadata });
    if (updated.error) throw updated.error;
    console.log(`Existing account kept as-is (password unchanged): ${email}`);
  }
  return u;
}


async function ensureRole(id, role) {
  const { error } = await supabase.from('user_roles').upsert({ user_id: id, role }, { onConflict: 'user_id,role' });
  if (error) throw error;
}

function makeTransactions(user, seed) {
  const random = rng(seed);
  const rows = [];
  let balance = user.opening;
  let n = 0;
  const names = ['Employer Payroll', 'Apartment Rent', 'Utility Provider', 'Card Purchase', 'Internal Transfer', 'Insurance Premium', 'Grocery Market', 'Travel Booking'];
  for (let y = 2023; y <= 2026; y++) {
    const start = y === 2023 ? 9 : 1;
    const end = y === 2026 ? 8 : 12;
    for (let m = start; m <= end; m++) {
      const salary = money(4200 + random() * 2600);
      const rent = money(1450 + random() * 750);
      const card = money(180 + random() * 520);
      const utility = money(90 + random() * 260);
      const set = [
        { direction: 'credit', amount: salary, memo: `${names[0]} · Monthly salary`, cp: user.name + ' Employer' },
        { direction: 'debit', amount: rent, memo: `${names[1]} · Monthly housing`, cp: 'Property Management' },
        { direction: 'debit', amount: card, memo: `${names[6]} · Purchase`, cp: 'Grocery Market' },
        { direction: 'debit', amount: utility, memo: `${names[2]} · Monthly bill`, cp: 'Utility Provider' },
      ];
      if (m % 3 === 0) set.push({ direction: 'credit', amount: money(450 + random() * 1100), memo: 'Internal transfer · Credit', cp: 'Rio Bridge Finance' });
      if (m % 5 === 0) set.push({ direction: 'debit', amount: money(250 + random() * 700), memo: `${names[5]} · Premium`, cp: 'Insurance Provider' });
      for (const item of set) {
        balance = money(balance + (item.direction === 'credit' ? item.amount : -item.amount));
        rows.push({ user_id: user.id, type: txType(n++), direction: item.direction, account: 'checking', amount: item.amount, currency: 'USD', counterparty: { name: item.cp, bank: 'Rio Bridge Finance' }, memo: item.memo, status: 'completed', created_at: isoDate(y, m, 3 + (n % 23)) });
      }
    }
  }
  return { rows, balance: money(balance) };
}

async function seedCustomer(user, seed) {
  const pin = await supabase.rpc('hash_pin', { _pin: user.pin });
  if (pin.error) throw pin.error;
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: user.id, full_name: user.name, first_name: user.first, last_name: user.last, middle_name: '', email: user.email,
    phone: user.phone, address: `${user.city}, ${user.state}`, city: user.city, state: user.state, zip: '00000', country: 'United States',
    marital_status: 'Single', occupation: 'Professional', employer: 'Private Sector', annual_income: 125000,
    account_number: user.account, routing_number: '021000021', account_type: 'Premier Checking', currency: 'USD', pin_hash: pin.data,
    status: 'active', email_verified: true, phone_verified: true, kyc_status: 'verified', two_factor_enabled: true,
    withdrawals_suspended: false, opening_balance: user.opening, checking_balance: 0, savings_balance: user.savings, loans_balance: 0,
    btc_balance: 0.125, btc_deposit_address: `bc1q${user.id.replaceAll('-', '').slice(0, 32)}`, card_type: 'Platinum', card_network: 'Visa',
    card_last4: user.account.slice(-4), card_expiry: '09/30', opened_date: '2023-08-15', wallet_unlock_deadline: null,
  }, { onConflict: 'id' });
  if (profileError) throw profileError;

  const ensure = await supabase.rpc('ensure_user_accounts', { _user_id: user.id });
  if (ensure.error) throw ensure.error;

  const generated = makeTransactions(user, seed);
  const finalBalance = generated.balance;
  const { error: clearTx } = await supabase.from('transactions').delete().eq('user_id', user.id);
  if (clearTx) throw clearTx;
  for (let i = 0; i < generated.rows.length; i += 400) {
    const { error } = await supabase.from('transactions').insert(generated.rows.slice(i, i + 400));
    if (error) throw error;
  }

  const accounts = await supabase.from('user_accounts').select('id,kind').eq('user_id', user.id);
  if (accounts.error) throw accounts.error;
  const byKind = Object.fromEntries((accounts.data ?? []).map((a) => [a.kind, a.id]));
  const accountRows = [
    { id: byKind.earning, user_id: user.id, kind: 'earning', is_primary: true, currency: 'USD', status: 'active', available_balance: finalBalance, pending_balance: 0, held_balance: 0, last_transaction_at: generated.rows.at(-1)?.created_at },
    { id: byKind.savings, user_id: user.id, kind: 'savings', is_primary: false, currency: 'USD', status: 'active', available_balance: user.savings, pending_balance: 0, held_balance: 0, last_transaction_at: isoDate(2026, 8, 15) },
    { id: byKind.investment, user_id: user.id, kind: 'investment', is_primary: false, currency: 'USD', status: 'active', available_balance: user.investment, pending_balance: 1250, held_balance: 0, last_transaction_at: isoDate(2026, 8, 1) },
  ];
  const { error: acctError } = await supabase.from('user_accounts').upsert(accountRows, { onConflict: 'id' });
  if (acctError) throw acctError;

  await supabase.from('loans').delete().eq('user_id', user.id);
  const activePrincipal = user.account.endsWith('4') ? 18750 : 26400;
  const pendingPrincipal = user.account.endsWith('4') ? 12000 : 18000;
  const activeLoan = { user_id: user.id, principal: activePrincipal, outstanding_principal: activePrincipal, total_repayment: money(activePrincipal * 1.095), monthly_payment: money(activePrincipal * 1.095 / 24), status: 'active', purpose: 'Home improvement and personal financing', term_months: 24, interest_rate: 9.5, approved_at: isoDate(2025, 11, 20), disbursed_at: isoDate(2025, 11, 24), next_payment_date: '2026-09-24', application_reference: `RBF-ACT-${user.account.slice(-6)}`, created_at: isoDate(2025, 11, 20) };
  const pendingLoan = { user_id: user.id, principal: pendingPrincipal, outstanding_principal: 0, total_repayment: 0, monthly_payment: 0, status: 'pending', purpose: 'Business expansion', term_months: 36, interest_rate: 10.25, application_reference: `RBF-PEN-${user.account.slice(-6)}`, created_at: isoDate(2026, 8, 20) };
  const loans = await supabase.from('loans').insert([activeLoan, pendingLoan]).select('id,user_id,status,principal');
  if (loans.error) throw loans.error;
  const loanId = loans.data.find((l) => l.status === 'active')?.id;

  await supabase.from('loan_payments').delete().eq('user_id', user.id);
  if (loanId) {
    const payments = [
      { loan_id: loanId, user_id: user.id, amount: 856.25, principal_amount: 690.25, interest_amount: 166, reference: `RBF-PMT-${user.account}-001`, payment_date: isoDate(2026, 6, 24) },
      { loan_id: loanId, user_id: user.id, amount: 856.25, principal_amount: 695.25, interest_amount: 161, reference: `RBF-PMT-${user.account}-002`, payment_date: isoDate(2026, 7, 24) },
      { loan_id: loanId, user_id: user.id, amount: 856.25, principal_amount: 700.25, interest_amount: 156, reference: `RBF-PMT-${user.account}-003`, payment_date: isoDate(2026, 8, 24) },
    ];
    const { error } = await supabase.from('loan_payments').insert(payments);
    if (error) throw error;
    const paidPrincipal = payments.reduce((sum, p) => sum + p.principal_amount, 0);
    await supabase.from('loans').update({ outstanding_principal: money(activePrincipal - paidPrincipal), total_repayment: money(activePrincipal * 1.095) }).eq('id', loanId);
  }

  await supabase.from('beneficiaries').delete().eq('user_id', user.id);
  const { error: benError } = await supabase.from('beneficiaries').insert([
    { user_id: user.id, name: 'Family Savings', account_number: '11004567231', bank_name: 'Rio Bridge Finance', routing_number: '021000021', beneficiary_type: 'domestic', status: 'active' },
    { user_id: user.id, name: 'Business Account', account_number: '22007891456', bank_name: 'Community Trust Bank', routing_number: '031000503', beneficiary_type: 'domestic', status: 'active' },
  ]);
  if (benError) throw benError;

  await supabase.from('notifications').delete().eq('user_id', user.id);
  await supabase.from('notifications').insert([
    { user_id: user.id, title: 'Welcome to Rio Bridge Finance', body: 'Your banking profile and accounts are ready.', kind: 'success', link: '/dashboard', created_at: isoDate(2026, 8, 1) },
    { user_id: user.id, title: 'Loan application under review', body: `Your ${pendingPrincipal.toLocaleString()} USD loan application is pending review.`, kind: 'info', link: '/loans', created_at: isoDate(2026, 8, 20) },
    { user_id: user.id, title: 'Loan payment received', body: 'Your August loan payment has been recorded.', kind: 'success', link: '/loans', created_at: isoDate(2026, 8, 24) },
  ]);

  const outstanding = money(activePrincipal - 2085.75);
  await supabase.from('profiles').update({ checking_balance: finalBalance, savings_balance: user.savings, loans_balance: outstanding }).eq('id', user.id);
  await supabase.from('admin_audit_logs').insert({ actor_id: null, actor_email: ADMIN.email, action: 'demo.seed', entity_type: 'profile', target_user_id: user.id, details: { seeded_transactions: generated.rows.length, range: '2023-09 through 2026-08' } });
  return { finalBalance, transactions: generated.rows.length, activePrincipal, pendingPrincipal };
}

const admin = await getOrCreate(ADMIN.email, ADMIN.password, { full_name: ADMIN.name, role: 'admin' });
await ensureRole(admin.id, 'admin');
await supabase.from('profiles').upsert({ id: admin.id, full_name: ADMIN.name, first_name: 'Rio Bridge', last_name: 'Administrator', email: ADMIN.email, account_number: '90000000001', status: 'active', currency: 'USD' }, { onConflict: 'id' });

for (let i = 0; i < USERS.length; i++) {
  const spec = USERS[i];
  const u = await getOrCreate(spec.email, spec.password, { full_name: spec.name, account_number: spec.account });
  await ensureRole(u.id, 'customer');
  const result = await seedCustomer({ ...spec, id: u.id }, 100 + i * 77);
  console.log(`${spec.name}: account ${spec.account}, balance $${result.finalBalance.toFixed(2)}, ${result.transactions} transactions, active loan $${result.activePrincipal.toFixed(2)}, pending $${result.pendingPrincipal.toFixed(2)}`);
}
console.log('\nRio Bridge Finance demo seed complete.');
console.log(`Admin: ${ADMIN.email} / ${ADMIN.password}`);
for (const u of USERS) console.log(`${u.name}: ${u.account} / ${u.password} / PIN ${u.pin}`);
