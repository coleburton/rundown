import {
  MESSAGE_TEMPLATES,
  MessageDeduplicator,
  formatMessage
} from '@/lib/message-templates';

describe('message templates', () => {
  beforeEach(() => {
    // reset static map
    (MessageDeduplicator as any).sentMessages = new Map();
  });

  test('hashMessage is deterministic', () => {
    const hash1 = MessageDeduplicator.hashMessage('hello world');
    const hash2 = MessageDeduplicator.hashMessage('hello world');
    const hash3 = MessageDeduplicator.hashMessage('something else');
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  test('canSendMessage prevents duplicates per contact', () => {
    const contactId = 'contact-1';
    const template = MESSAGE_TEMPLATES.supportive['missed-goal'][0];
    const hash = MessageDeduplicator.hashMessage(template);

    expect(MessageDeduplicator.canSendMessage(contactId, hash)).toBe(true);
    expect(MessageDeduplicator.canSendMessage(contactId, hash)).toBe(false);
    expect(MessageDeduplicator.canSendMessage('contact-2', hash)).toBe(true);
  });

  test('getUniqueMessage retries until unique message found', () => {
    const contactId = 'contact-1';
    const type = 'missed-goal';
    const style = 'supportive' as const;
    const template = MESSAGE_TEMPLATES[style][type][0];
    const hash = MessageDeduplicator.hashMessage(template);

    // mark first template as used
    MessageDeduplicator.canSendMessage(contactId, hash);

    const result = MessageDeduplicator.getUniqueMessage(contactId, style, type);
    expect(result).not.toBe(template);
    expect(MESSAGE_TEMPLATES[style][type]).toContain(result);
  });

  test('formatMessage replaces template variables', () => {
    const template = 'Hi {user}, {completed}/{goal} {goalType} remain {remaining}';
    const formatted = formatMessage(template, {
      user: 'Alex',
      completed: 2,
      goal: 5,
      remaining: 3,
      goalType: 'runs'
    });
    expect(formatted).toBe('Hi Alex, 2/5 running remain 3');
  });
});
