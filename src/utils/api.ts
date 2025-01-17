import type { AxiosResponse } from 'axios';
import axios from 'axios';
import type { Product } from '@/types';
import { Toast } from '@/utils/global';

interface Data {
  data: Product
}

const { VITE_URL, VITE_PATH } = import.meta.env;

const request = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }
});

export function successMsg(title: string, text?: string) {
  return Toast.fire({
    icon: 'success',
    title,
    text,
  });
}

export function errorMsg(title: string, text?: string) {
  return Toast.fire({
    icon: 'error',
    title,
    text,
  });
}

request.interceptors.request.use(
  async (config) => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/,
      '$1',
    );
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const csrfToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)csrftoken\s*=\s*([^;]*).*$)|^.*$/,
      '$1',
    );
    
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  },
  (error) => {
    console.error('請求攔截器錯誤:', error);
    return Promise.reject(error);
  }
);

request.interceptors.response.use(
  (res: AxiosResponse) => {
    // JWT token 處理
    if (res.data?.access) {
      document.cookie = `token=${res.data.access}; path=/`;
    }
    if (res.data?.refresh) {
      document.cookie = `refresh_token=${res.data.refresh}; path=/`;
    }
    return res;
  },
  (error) => {
    if (error.response) {
      console.error('API 錯誤響應:', error.response);
      switch (error.response.status) {
        case 401:
          errorMsg('登入失敗', error.response.data?.detail || '帳號或密碼錯誤');
          break;
        case 403:
          errorMsg('權限不足', error.response.data?.detail || '請確認您的帳號權限');
          break;
        case 404:
          errorMsg('請求失敗', 'API 端點不存在');
          break;
        case 500:
          errorMsg('伺服器錯誤', '請稍後再試');
          break;
        default:
          if (error.response.data?.detail) {
            errorMsg(error.response.data.detail);
          } else {
            errorMsg('發生錯誤', '請稍後再試');
          }
      }
    } else if (error.request) {
      console.error('網路請求錯誤:', error.request);
      errorMsg('網路錯誤', '無法連接到伺服器，請確認伺服器是否運行中');
    } else {
      console.error('請求配置錯誤:', error.message);
      errorMsg('請求錯誤', error.message);
    }
    return Promise.reject(error);
  }
);

const api = {
  user: {
    signin: 'api/token/',
    register: 'api/user/register/',
    logout: 'api/user/logout/',
    checkSigin: 'api/user/check-auth/',
    refreshToken: 'api/token/refresh/',
    product: `api/${VITE_PATH}/product`,
    cart: `api/${VITE_PATH}/cart`,
    coupon: `api/${VITE_PATH}/coupon`,
    order: `api/${VITE_PATH}/order`,
    pay: `api/${VITE_PATH}/pay`,
  },
  admin: {
    product: `api/${VITE_PATH}/admin/product`,
    upload: `api/${VITE_PATH}/admin/upload`,
    order: `api/${VITE_PATH}/admin/order`,
    coupon: `api/${VITE_PATH}/admin/coupon`,
  },
};

// API USER
const apiUserRegister = (data: FormData) => request.post(api.user.register, data);
const apiUserSignin = async (data: any) => {
  try {
    const response = await request.post(api.user.signin, data);
    if (response.data?.access) {
      document.cookie = `token=${response.data.access}; path=/`;
    }
    return response;
  } catch (error) {
    console.error('登入錯誤:', error);
    throw error;
  }
};
const apiUserLogout = () => request.post(api.user.logout);
const apiUserCheckSignin = () => request.post(api.user.checkSigin);
const apiUserGetAllProducts = () => request.get(`${api.user.product}s/all`);
function apiUserGetProducts(category: string = '') {
  if (category)
    return request.get(`${api.user.product}s?category=${category}`);

  return request.get(`${api.user.product}s`);
}
const apiUSerGetProduct = (id: string) => request.get(`${api.user.product}/${id}`);
const apiUserGetCarts = () => request.get(api.user.cart);
const apiUserPostCart = (data: any) => request.post(api.user.cart, data);
const apiUserDelCart = (id: string) => request.delete(`${api.user.cart}/${id}`);
const apiUserDelCarts = () => request.delete(`${api.user.cart}/s`);
const apiUserPostCoupon = (data: any) => request.post(api.user.coupon, data);
const apiUserGetOrder = (id: string) => request.get(`${api.user.order}/${id}`);
const apiUserPostOrder = (data: any) => request.post(api.user.order, data);
const apiUserPostPay = (id: string) => request.post(`${api.user.pay}/${id}`);

// API Admin
const apiAdminGetProducts = (page: number) => request.get(`${api.admin.product}s?page=${page}`);
const apiAdminGetAllProducts = () => request.get(`${api.admin.product}s/all`);
const apiAdminPostProduct = (data: Data) => request.post(api.admin.product, data);
const apiAdminPutProduct = (id: string, data: Data) => request.put(`${api.admin.product}/${id}`, data);
const apiAdminDelProduct = (id: string) => request.delete(`${api.admin.product}/${id}`);
function apiAdminUploadImage(formData: FormData) {
  return request.post(api.admin.upload, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
const apiAdminGetOrders = () => request.get(`${api.admin.order}s`);
const apiAdminPutOrder = (id: string, data: any) => request.put(`${api.admin.order}/${id}`, data);
const apiAdminDelOrder = (id: string) => request.delete(`${api.admin.order}/${id}`);
const apiAdminDelOrders = () => request.delete(`${api.admin.order}s/all`);
const apiAdminGetCoupons = () => request.get(`${api.admin.coupon}s`);
const apiAdminPostCoupon = (data: any) => request.post(`${api.admin.coupon}`, data);
const apiAdminPutCoupon = (id: string, data: any) => request.put(`${api.admin.coupon}/${id}`, data);
const apiAdminDelCoupon = (id: string) => request.delete(`${api.admin.coupon}/${id}`);

export {
  api,
  apiAdminGetAllProducts,
  apiAdminGetProducts,
  apiAdminPostProduct,
  apiAdminPutProduct,
  apiAdminDelProduct,
  apiAdminUploadImage,
  apiAdminGetOrders,
  apiAdminPutOrder,
  apiAdminDelOrder,
  apiAdminDelOrders,
  apiAdminGetCoupons,
  apiAdminPostCoupon,
  apiAdminPutCoupon,
  apiAdminDelCoupon,
  apiUserSignin,
  apiUserLogout,
  apiUserCheckSignin,
  apiUserGetAllProducts,
  apiUserGetCarts,
  apiUSerGetProduct,
  apiUserGetProducts,
  apiUserPostCart,
  apiUserDelCart,
  apiUserDelCarts,
  apiUserPostCoupon,
  apiUserGetOrder,
  apiUserPostOrder,
  apiUserPostPay,
  apiUserRegister,
};
