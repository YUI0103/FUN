import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { apiUserLogout, apiUserSignin } from '../utils/api';

const useUserStore = defineStore('user', () => {
  const router = useRouter();

  const loginStatus = ref(false);
  const isLoading = ref(false);
  const userData = ref(null);

  // 檢查登入狀態
  const checkLoginStatus = () => {
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, "$1");
    loginStatus.value = !!token;
    return loginStatus.value;
  };

  const signin = async (data) => {
    isLoading.value = true;
    console.log('開始登入流程');

    try {
      const res = await apiUserSignin({
        username: data.username,
        password: data.password,
        csrfmiddlewaretoken: document.cookie.replace(/(?:(?:^|.*;\s*)csrftoken\s*=\s*([^;]*).*$)|^.*$/, "$1")
      });
      console.log('收到登入回應:', res);

      const {
        data: { success, token, user }
      } = res;

      if (success) {
        document.cookie = `token=${token};path=/;`;
        loginStatus.value = true;
        userData.value = user;
        console.log('登入成功，用戶資料:', user);
        router.push({ name: 'AdminHome' });
      }
    } catch (error) {
      console.error('登入失敗:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;
    console.log('開始登出流程');

    try {
      const res = await apiUserLogout();
      console.log('收到登出回應:', res);

      const {
        data: { success },
      } = res;

      if (success) {
        document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;';
        loginStatus.value = false;
        userData.value = null;
        console.log('登出成功');
        router.push({ name: 'Home' });
      }
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 初始化時檢查登入狀態
  checkLoginStatus();

  return { 
    isLoading, 
    loginStatus, 
    userData,
    signin, 
    logout,
    checkLoginStatus 
  };
});

export default useUserStore;
