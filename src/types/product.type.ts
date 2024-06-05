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

/*
interface productSizeOptions {
  _id: number;
  name: string;
  stock?: number;
  price?: number;
  discountedPrice?: number;
  discountPercent?: number;
  colorStock?: {
    _id: number;
    stock: number;
    price?: number;
    connectionId?: string;
    discountedPrice?: number;
    discountPercent?: number;
  }[];
}

interface productColorOptions {
  _id: number;
  name: string;
  image: string;
  stock?: number;
  price?: number;
  connectionId?: string;
  discountedPrice?: number;
  discountPercent?: number;
}
interface ProductInterface {
  title: string;
  highlight: string[];
  image?: string[];
  category: string;
  brand: string;
  price?: number;
  stock?: number;
  discountedPrice?: number;
  discountPercent?: number;
  isColor: boolean;
  isSize: boolean;
  color?: productColorOptions[];
  size?: {
    ram: productSizeOptions[];
    [index: string]: productSizeOptions[];
  };
}
interface ProductFnParams {
  title: string;
  highlight: string[];
  category: string;
  brand: string;
  isColor: boolean;
  isSize: boolean;
  color: {
    _id: number;
    name: string;
    link: string;
    stock?: number;
    price?: number;
    discountedPrice?: number;
  }[];
  size: {
    ram: productSizeOptions[];
    [index: string]: productSizeOptions[];
  };
}

export interface ProductFnReturnType {
  success: boolean;
  message: string;
  data: ProductInterface | {};
}

export interface newProductRequestBody {
  name: string;
  age: number;
  gender: string;
}
*/

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
