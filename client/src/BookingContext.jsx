import { createContext, useContext, useState } from 'react';
const Ctx = createContext();
// Holds the in-progress booking between pages: { schedule, seats, passengers, contact, boardingPoint, droppingPoint }
export const BookingProvider = ({ children }) => { const [draft, setDraft] = useState({}); return <Ctx.Provider value={{ draft, setDraft }}>{children}</Ctx.Provider>; };
export const useBooking = () => useContext(Ctx);
