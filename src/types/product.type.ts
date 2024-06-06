import { Document, Types } from "mongoose";

// Interface for the main Product document
export interface IProduct extends Document {
  uniqueId?: Types.ObjectId;
  title: string;
  brand: string;
  category: string;
  image: string[];
  highlight: string[];
  price: number;
  MRP?: number;
  discountPercent?: number;
  stock?: number;
  colorName?: string;
  rating?: number;
  ratingCount?: number;
  selectedSizeIndex?: number;
  size?: IProductSize[];
  color?: IProductColor[];
  moreDetails?: Types.ObjectId;
}

// Interface for Color subDocument
export interface IProductColor {
  productId: string;
  image: string;
  name: string;
}

// Interface for Size subDocument
export interface IProductSize {
  name: string;
  title: string;
  price: number;
  MRP?: number;
  discountPercent?: number;
  stock: number;
}

export interface searchRequestQuery {
  query?: string;
  category?: string;
  sort_by?: string;
  page?: string;
  limit?: string;
  rating?: string;
  ratingCount?: string;
  brand?: string;
  discountPercent?: string;
  price?: { gte?: string; lte?: string; gt?: string; lt?: string };
}

export interface searchBaseQuery {
  $or?: [
    { title: { $regex: string; $options: string } },
    { "size.title": { $regex: string; $options: string } },
  ];
  rating?: string;
  ratingCount?: string;
  price?: { gte?: string; lte?: string; gt?: string; lt?: string };
  category?: string;
  brand?: string;
  discountPercent?: string;
}

export interface ICoupon {
  code: string;
  discount: number;
  createdAt: Date;
}

export interface ICategory {
  name: string;
  image: string;
}

export interface searchCategoryQuery {
  query?: string;
  sort_by?: string;
  page?: string;
  limit?: string;
}
