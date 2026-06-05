const isoTimeFormat = (dateTime) => {
  const date = new Date(dateTime);

  const localTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return localTime; // e.g. "02:15:30 PM"
};

export default isoTimeFormat;
