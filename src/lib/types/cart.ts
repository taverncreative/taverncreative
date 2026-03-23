export interface CartItem {
  cartItemId: string; // unique ID per cart entry
  productId: string;
  productName: string;
  productSlug: string;
  designCollectionName: string;
  collectionSlug?: string;
  mockupImage: string | null;
  quantity: number;
  unitPrice: number;
  personalisationData: Record<string, string>;
}

export interface Cart {
  items: CartItem[];
}

export function getCartTotal(cart: Cart): number {
  return cart.items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );
}

export function getCartItemCount(cart: Cart): number {
  return cart.items.reduce((count, item) => count + item.quantity, 0);
}
