import { Twilio } from 'twilio';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromPhoneNumber: string;
}

class TwilioService {
  private client: Twilio | null = null;
  private config: TwilioConfig | null = null;

  initialize(config: TwilioConfig) {
    this.config = config;
    this.client = new Twilio(config.accountSid, config.authToken);
  }

  async sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
    if (!this.client || !this.config) {
      return { success: false, error: 'Twilio not initialized' };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.config.fromPhoneNumber,
        to: to
      });

      return { 
        success: true, 
        messageId: result.sid 
      };
    } catch (error) {
      console.error('Twilio SMS Error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  isInitialized(): boolean {
    return this.client !== null && this.config !== null;
  }
}

export const twilioService = new TwilioService();