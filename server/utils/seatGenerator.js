// Reusable: builds seat documents from a bus. Sleeper = 3 per row (1+2), others = 4 per row (2+2).
export function generateSeats(bus) {
  const sleeper = /sleeper/i.test(bus.busType) && !/semi/i.test(bus.busType);
  const cols = sleeper ? 3 : 4, seats = [];
  for (let i = 0; i < bus.totalSeats; i++) {
    const row = Math.floor(i / cols) + 1, column = (i % cols) + 1;
    seats.push({ bus: bus._id, seatNumber: `${String.fromCharCode(64 + row)}${column}`, row, column,
      seatType: sleeper ? 'Sleeper' : column === 1 || column === cols ? 'Window' : 'Aisle' });
  }
  return seats;
}
