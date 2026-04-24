const [recurrings, setRecurrings] = useState([]);
const [form, setForm] = useState({
  clientId: '', title: '', frequency: 'monthly',
  startDate: '', endDate: '', taxRate: 12,
  autoSend: false, lineItems: [],
});

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly', addDays: 7 },
  { value: 'biweekly', label: 'Bi-weekly', addDays: 14 },
  { value: 'monthly', label: 'Monthly', addMonths: 1 },
  { value: 'quarterly', label: 'Quarterly', addMonths: 3 },
  { value: 'yearly', label: 'Yearly', addMonths: 12 },
];

const createRecurring = async (data) => {
  const { lineItems, ...rest } = data;
  const { data: rec } = await supabase
    .from('recurring_invoices')
    .insert({ ...rest, user_id: user.id, next_due: data.startDate })
    .select().single();
  
  await supabase.from('recurring_line_items').insert(
    lineItems.map(li => ({ recurring_id: rec.id, ...li }))
  );
};