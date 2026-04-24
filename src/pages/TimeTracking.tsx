function TimeTrackingPage() {
  const [entries, setEntries] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

 
  useEffect(() => {
    if (!activeTimer) return;

    const intervalId = setInterval(() => {
      const start = new Date(activeTimer.startTime).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [activeTimer]);
      
  const startTimer = (clientId, description, hourlyRate) => {
    setActiveTimer({
      clientId,
      description,
      hourlyRate,
      startTime: new Date().toISOString(),
    });
    setElapsedSeconds(0);
  };

  const stopTimer = async () => {
    if (!activeTimer || !user?.id) return;

    const durationMinutes = Math.ceil(elapsedSeconds / 60);

    try {
      await supabase.from('time_entries').insert({
        user_id: user.id,
        client_id: activeTimer.clientId,
        description: activeTimer.description,
        start_time: activeTimer.startTime,
        end_time: new Date().toISOString(),
        duration_minutes: durationMinutes,
        hourly_rate: activeTimer.hourlyRate,
      });

      setActiveTimer(null);
      setElapsedSeconds(0);
      refreshEntries();
    } catch (error) {
      console.error('Failed to save time entry:', error);
    }
  };
  
  const billEntries = async (entryIds) => {
    const selectedEntries = entries.filter(e => entryIds.includes(e.id));

    if (selectedEntries.length === 0) return;

    const lineItems = selectedEntries.map(entry => {
      const hours = entry.durationMinutes / 60;

      return {
        description: `${entry.description} (${hours.toFixed(1)}h)`,
        quantity: Number(hours.toFixed(2)),
        unitPrice: entry.hourlyRate,
      };
    });
    navigate('/invoices/new', {
      state: {
        prefill: {
          lineItems,
          clientId: selectedEntries[0].clientId,
        },
      },
    });

    try {
      await supabase
        .from('time_entries')
        .update({ is_billed: true })
        .in('id', entryIds);
    } catch (error) {
      console.error('Failed to mark entries as billed:', error);
    }
  };
   
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [hours, minutes, secs]
      .map(unit => unit.toString().padStart(2, '0'))
      .join(':');
  };

}