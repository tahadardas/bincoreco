export const dictionaries = {
  ar: {
    home: 'الرئيسية',
    products: 'المنتجات',
    beans: 'البن',
    cart: 'السلة',
    orders: 'طلباتي',
    login: 'دخول',
    bestSellers: 'الأكثر طلباً',
    maestroPicks: 'اختيار المايسترو',
    addToCart: 'أضف للسلة',
    total: 'المجموع',
    checkout: 'تأكيد الطلب',
    pickup: 'وقت الاستلام',
    status: 'الحالة',
    orderNow: 'اطلب للاستلام',
  },
  en: {
    home: 'Home',
    products: 'Products',
    beans: 'Beans',
    cart: 'Cart',
    orders: 'My Orders',
    login: 'Login',
    bestSellers: 'Best Sellers',
    maestroPicks: 'Maestro Picks',
    addToCart: 'Add to Cart',
    total: 'Total',
    checkout: 'Checkout',
    pickup: 'Pickup Time',
    status: 'Status',
    orderNow: 'Order Now',
  },
};

export type Locale = 'ar' | 'en';

export function t(key: string, locale: Locale = 'ar'): string {
  return (dictionaries[locale] as any)[key] || key;
}
