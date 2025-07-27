import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  PurchasesError 
} from 'react-native-purchases';

export interface SubscriptionPlan {
  id: string;
  title: string;
  price: string;
  period: string;
  packageType: string;
  isPopular?: boolean;
  discount?: string;
  rcPackage: PurchasesPackage;
}

class RevenueCatService {
  private isInitialized = false;
  
  async initialize(apiKey: string): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await Purchases.configure({ apiKey });
      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('RevenueCat initialization failed:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<SubscriptionPlan[]> {
    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      
      if (!currentOffering) {
        throw new Error('No current offering available');
      }

      return this.mapPackagesToPlans(currentOffering);
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  private mapPackagesToPlans(offering: PurchasesOffering): SubscriptionPlan[] {
    const plans: SubscriptionPlan[] = [];
    
    // Monthly package
    if (offering.monthly) {
      plans.push({
        id: 'monthly',
        title: 'Monthly',
        price: offering.monthly.product.priceString,
        period: '/month',
        packageType: 'monthly',
        rcPackage: offering.monthly,
      });
    }

    // Annual package
    if (offering.annual) {
      plans.push({
        id: 'yearly',
        title: 'Yearly',
        price: offering.annual.product.priceString,
        period: '/year',
        packageType: 'annual',
        isPopular: true,
        discount: 'Save 50%',
        rcPackage: offering.annual,
      });
    }

    return plans;
  }

  async purchasePackage(rcPackage: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(rcPackage);
      return customerInfo;
    } catch (error) {
      const purchasesError = error as PurchasesError;
      
      if (purchasesError.userCancelled) {
        throw new Error('Purchase was cancelled');
      }
      
      console.error('Purchase failed:', purchasesError);
      throw new Error('Purchase failed. Please try again.');
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Restore failed:', error);
      throw new Error('Failed to restore purchases');
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  async isUserSubscribed(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  async setUserID(userID: string): Promise<void> {
    try {
      await Purchases.logIn(userID);
    } catch (error) {
      console.error('Failed to set user ID:', error);
      throw error;
    }
  }

  async logOut(): Promise<void> {
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to log out:', error);
      throw error;
    }
  }
}

export const revenueCat = new RevenueCatService();