import { Contact } from '../types/mock';
import { storage } from './storage';

// Initial mock contacts
const INITIAL_CONTACTS: Contact[] = [
  {
    id: '1',
    userId: '1',
    name: 'Alice Runner',
    email: 'alice@example.com',
    phone: '+1234567890',
    phoneNumber: '+1234567890',
    notificationPreference: 'all',
    isActive: true,
  },
  {
    id: '2',
    userId: '1',
    name: 'Bob Jogger',
    email: 'bob@example.com',
    phone: '+1987654321',
    phoneNumber: '+1987654321',
    notificationPreference: 'missed-goals',
    isActive: true,
  },
];

export class MockContacts {
  private static instance: MockContacts;
  private contacts: Contact[] = [];

  private constructor() {
    // Initialize contacts
    this.initFromStorage();
  }

  private async initFromStorage() {
    const storedContacts = await storage.getContacts();
    if (storedContacts.length > 0) {
      this.contacts = storedContacts;
    } else {
      this.contacts = [...INITIAL_CONTACTS];
      await storage.setContacts(this.contacts);
    }
  }

  static getInstance(): MockContacts {
    if (!MockContacts.instance) {
      MockContacts.instance = new MockContacts();
    }
    return MockContacts.instance;
  }

  async getContacts(userId: string): Promise<Contact[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.contacts.filter(contact => contact.userId === userId);
  }

  async addContact(contact: Omit<Contact, 'id'>): Promise<Contact> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newContact: Contact = {
      ...contact,
      id: `contact-${Date.now()}`,
      isActive: contact.isActive ?? true,
      phone: contact.phone || contact.phoneNumber,
    };

    this.contacts.push(newContact);
    await storage.setContacts(this.contacts);
    return newContact;
  }

  async updateContact(contact: Contact): Promise<Contact> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const index = this.contacts.findIndex(c => c.id === contact.id);
    if (index === -1) {
      throw new Error('Contact not found');
    }

    this.contacts[index] = contact;
    await storage.setContacts(this.contacts);
    return contact;
  }

  async deleteContact(contactId: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const index = this.contacts.findIndex(c => c.id === contactId);
    if (index === -1) {
      throw new Error('Contact not found');
    }

    // Soft delete by setting isActive to false
    this.contacts[index] = {
      ...this.contacts[index],
      isActive: false,
    };
    await storage.setContacts(this.contacts);
  }

  async getActiveContacts(userId: string): Promise<Contact[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return this.contacts.filter(
      contact => contact.userId === userId && contact.isActive
    );
  }
} 
