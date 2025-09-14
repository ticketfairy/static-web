import { useState, useEffect } from 'react';

export interface Ticket {
  id: string;
  name: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  type: 'Bug' | 'Feature' | 'Enhancement' | 'Task';
  estimatedTime: string;
  acceptanceCriteria: string[];
  tags: string[];
  createdAt: Date;
  videoId?: string;
}

const STORAGE_KEY = 'ticket-fairy-tickets';

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  // Load tickets from localStorage on mount
  useEffect(() => {
    const storedTickets = localStorage.getItem(STORAGE_KEY);
    if (storedTickets) {
      try {
        const parsedTickets = JSON.parse(storedTickets).map((ticket: any) => ({
          ...ticket,
          createdAt: new Date(ticket.createdAt)
        }));
        setTickets(parsedTickets);
      } catch (error) {
        console.error('Failed to load tickets from localStorage:', error);
      }
    }
  }, []);

  // Save tickets to localStorage whenever tickets change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }, [tickets]);

  const addTicket = (ticket: Omit<Ticket, 'id' | 'createdAt'>) => {
    const newTicket: Ticket = {
      ...ticket,
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    setTickets(prev => [newTicket, ...prev]);
    return newTicket;
  };

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === id ? { ...ticket, ...updates } : ticket
      )
    );
  };

  const deleteTicket = (id: string) => {
    setTickets(prev => prev.filter(ticket => ticket.id !== id));
  };

  return {
    tickets,
    addTicket,
    updateTicket,
    deleteTicket
  };
}
