import { useState, useEffect, useCallback } from 'react';
import { Contact } from '../types/mock';
import { MockContacts } from '../lib/mock-contacts';
import { useMockData } from '../lib/mock-data-context';
import { useMockAuth } from './useMockAuth';

export function useMockContacts() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state, setContacts, addContact: addContactToStore, updateContact: updateContactInStore } = useMockData();
  const { user } = useMockAuth();
  const contacts = MockContacts.getInstance();

  const fetchContacts = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const fetchedContacts = await contacts.getContacts(user.id);
      setContacts(fetchedContacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    } finally {
      setIsLoading(false);
    }
  }, [user, setContacts]);

  const addContact = useCallback(async (contactData: Omit<Contact, 'id' | 'userId'>) => {
    if (!user) return null;

    try {
      setIsLoading(true);
      setError(null);
      const newContact = await contacts.addContact({
        ...contactData,
        userId: user.id,
      });
      addContactToStore(newContact);
      return newContact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, addContactToStore]);

  const updateContact = useCallback(async (contact: Contact) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedContact = await contacts.updateContact(contact);
      updateContactInStore(updatedContact);
      return updatedContact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contact');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [updateContactInStore]);

  const deleteContact = useCallback(async (contactId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await contacts.deleteContact(contactId);
      // Update the contact in store to reflect inactive status
      const contact = state.contacts.find(c => c.id === contactId);
      if (contact) {
        updateContactInStore({ ...contact, isActive: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
    } finally {
      setIsLoading(false);
    }
  }, [state.contacts, updateContactInStore]);

  const getActiveContacts = useCallback(async () => {
    if (!user) return [];

    try {
      return await contacts.getActiveContacts(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active contacts');
      return [];
    }
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts: state.contacts,
    isLoading,
    error,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    getActiveContacts,
  };
} 