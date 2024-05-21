export interface productSizeOptions {
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

export interface ProductInterface {
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
  color?: {
    _id: number;
    name: string;
    image: string;
    stock?: number;
    price?: number;
    connectionId?: string;
    discountedPrice?: number;
    discountPercent?: number;
  }[];
  size?: {
    ram: productSizeOptions[];
    [index: string]: productSizeOptions[];
  };
}

export interface ProductFnParams {
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
