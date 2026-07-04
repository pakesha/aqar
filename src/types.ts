/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PropertyType = 'apartment' | 'villa' | 'land' | 'commercial';
export type OperationType = 'sale' | 'rent';
export type PropertyStatus = 'available' | 'sold' | 'rented' | 'pending';
export type FinishingType = 'lux' | 'super-lux' | 'normal';
export type VerificationStatus = 'unverified' | 'pending' | 'verified';
export type UserRole = 'seller' | 'buyer' | 'landlord' | 'tenant' | 'admin';

export interface NearPlace {
  type: 'school' | 'hospital' | 'mall' | 'mosque' | 'park';
  name: string;
  distance: number; // in km
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: OperationType;
  propertyType: PropertyType;
  price: number;
  area: number; // in sqm
  rooms: number;
  bathrooms: number;
  floor?: number;
  yearBuilt: number;
  finishing: FinishingType;
  direction: string; // e.g., 'north', 'south', 'east', 'west'
  address: string;
  city: string;
  lat: number;
  lng: number;
  images: string[];
  videoUrl?: string;
  isFeatured: boolean;
  isVerified: boolean;
  status: PropertyStatus;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  features: string[];
  nearPlaces: NearPlace[];
  viewsCount: number;
  favoritesCount: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: UserRole[];
  activeRole: UserRole;
  isVerified: boolean;
  avatar: string;
  idCardUrl?: string;
  idCardBackUrl?: string;
  verificationStatus: VerificationStatus;
  isRestricted?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  propertyId: string;
  propertyName: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Invoice {
  id: string;
  propertyId: string;
  propertyName: string;
  amount: number;
  commissionRate: number; // percentage e.g., 2.5
  commissionAmount: number;
  type: OperationType;
  status: 'unpaid' | 'paid';
  date: string;
  payerName: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
