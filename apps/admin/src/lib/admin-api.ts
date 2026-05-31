import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { adminFetch, adminUpload } from './api';
import type { OrderStatus } from '@banco-ricco/types';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type ApiData<T> = { data?: T; success?: boolean; message?: string };

async function get<T>(endpoint: string): Promise<T> {
  const res = await adminFetch<ApiData<T>>(endpoint);
  return (res as ApiData<T>).data ?? (res as T);
}

async function put<T = void>(endpoint: string, body?: unknown): Promise<T> {
  const res = await adminFetch<ApiData<T>>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
  return (res as ApiData<T>).data ?? (res as T);
}

async function del(endpoint: string): Promise<void> {
  await adminFetch(endpoint, { method: 'DELETE' });
}

/* ------------------------------------------------------------------ */
/*  Query key factories                                                */
/* ------------------------------------------------------------------ */

export const queryKeys = {
  orders: (filters?: Record<string, string>) => ['orders', filters] as QueryKey,
  products: (filters?: Record<string, string>) => ['products', filters] as QueryKey,
  members: (filters?: Record<string, string>) => ['members', filters] as QueryKey,
  reviews: (filters?: Record<string, string>) => ['reviews', filters] as QueryKey,
  loyalty: (filters?: Record<string, string>) => ['loyalty', filters] as QueryKey,
  banners: () => ['banners'] as QueryKey,
  contactMessages: (filters?: Record<string, string>) => ['contact-messages', filters] as QueryKey,
  settings: () => ['settings'] as QueryKey,
  dashboard: () => ['dashboard'] as QueryKey,
};

/* ------------------------------------------------------------------ */
/*  Orders                                                             */
/* ------------------------------------------------------------------ */

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: { amount: number; currency: string };
  currencyCode?: string;
  pickupTime: string;
  createdAt: string;
  cancellationReason?: string | null;
  customer: { fullName: string; phone: string | null } | null;
  guestName?: string | null;
  guestPhone?: string | null;
  items: {
    id: string;
    productNameSnapshot: string;
    quantity: number;
    grindType?: string | null;
    grindOptionNameAr?: string | null;
    grindOptionNameEn?: string | null;
    variantSnapshot?: { name?: string; sizeValue?: number; sizeUnit?: string } | null;
  }[];
}

export function useOrders(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return useQuery({
    queryKey: queryKeys.orders(filters),
    queryFn: () => get<Order[]>(`/admin/orders${params}`),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      put(`/admin/orders/${id}/status`, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Products                                                           */
/* ------------------------------------------------------------------ */

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  type: string;
  isActive: boolean;
  isBestSeller: boolean;
  isMaestroPick: boolean;
  imageUrl?: string | null;
  categoryId: string;
  basePrice: number;
  currencyCode: string;
  createdAt: string;
}

export function useProducts(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => get<Product[]>(`/admin/products${params}`),
  });
}

export function useToggleProductFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, flag }: { id: string; flag: string }) =>
      put(`/admin/products/${id}`, { [flag]: undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Record<string, unknown> & { id: string }) =>
      put(`/admin/products/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Members                                                            */
/* ------------------------------------------------------------------ */

export interface Member {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export function useMembers(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return useQuery({
    queryKey: queryKeys.members(filters),
    queryFn: () => get<Member[]>(`/admin/users${params}`),
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      put(`/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useToggleMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      put(`/admin/users/${id}/toggle-status`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Reviews                                                            */
/* ------------------------------------------------------------------ */

export interface Review {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user: { fullName: string } | null;
  product: { translations: { name: string }[] } | null;
}

export function useReviews(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return useQuery({
    queryKey: queryKeys.reviews(filters),
    queryFn: () => get<Review[]>(`/admin/reviews${params}`),
  });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      put(`/admin/reviews/${id}/moderate`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Loyalty                                                            */
/* ------------------------------------------------------------------ */

export interface LoyaltyAccount {
  id: string;
  points: number;
  lifetimePoints: number;
  tier: string;
  user: { fullName: string; phone: string } | null;
  createdAt: string;
}

export function useLoyalty(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return useQuery({
    queryKey: queryKeys.loyalty(filters),
    queryFn: () => get<LoyaltyAccount[]>(`/admin/loyalty${params}`),
  });
}

export function useRedeemLoyalty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, points }: { accountId: string; points: number }) =>
      put(`/admin/loyalty/${accountId}/redeem`, { points }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['loyalty'] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Banners                                                            */
/* ------------------------------------------------------------------ */

export interface Banner {
  id: string;
  titleAr: string;
  titleEn: string;
  isActive: boolean;
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  startsAt: string;
  endsAt: string;
}

export function useBanners() {
  return useQuery({
    queryKey: queryKeys.banners(),
    queryFn: () => get<Banner[]>('/admin/banners'),
  });
}

export function useToggleBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      put(`/admin/banners/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Contact Messages                                                   */
/* ------------------------------------------------------------------ */

export interface ContactMessage {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function useContactMessages(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return useQuery({
    queryKey: queryKeys.contactMessages(filters),
    queryFn: () => get<ContactMessage[]>(`/admin/contact-messages${params}`),
  });
}

export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      put(`/admin/contact-messages/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contact-messages'] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Settings                                                           */
/* ------------------------------------------------------------------ */

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => get<Record<string, string>>('/admin/settings'),
  });
}

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      put(`/admin/settings/${key}`, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}

/* ------------------------------------------------------------------ */
/*  Dashboard stats                                                    */
/* ------------------------------------------------------------------ */

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalMembers: number;
  activeMembers: number;
  revenueToday: number;
  revenueMonth: number;
  topProducts: { name: string; total: number }[];
}

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: () => get<DashboardStats>('/admin/dashboard'),
  });
}
