export type Role = 'admin' | 'editor' | 'guest';

export type Restaurant = {
  id: string;
  name: string;
  logoUrl?: string;
  backgroundUrl?: string;
  themeColor?: string;
  isActive: boolean;
};

export type Category = {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  order?: number;
};

export type Item = {
  id: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  order?: number;
  available?: boolean;
};
