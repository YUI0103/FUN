import { defineStore } from 'pinia';
import { ref } from 'vue';
import { apiUserSignin, apiUserLogout, apiUserCheckSignin } from '../utils/api';
import { useRouter } from 'vue-router';

export const useUserStore = defineStore('user', () => {
  const router = useRouter();
  const userInfo = ref(null);
  const loginStatus = ref(false);
  const isLoading = ref(false);

  // 登入功能
  const signin = async (data: { username: string; password: string; rememberMe?: boolean }) => {
    isLoading.value = true;

    try {
      const res = await apiUserSignin({
        username: data.username,
        password: data.password,
      });

      const { data: { success, token, user } } = res;

      if (success) {
        // 設置 cookie 過期時間
        const expires = data.rememberMe
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
          : '';

        document.cookie = `token=${token};path=/;expires=${expires}`;
        if (res.data.refresh) {
          document.cookie = `refresh_token=${res.data.refresh};path=/;expires=${expires}`;
        }

        loginStatus.value = true;
        userInfo.value = user;

        // 如果選擇記住我，保存用戶資料
        if (data.rememberMe) {
          localStorage.setItem('userInfo', JSON.stringify(user));
        }

        // 登入成功後跳轉到首頁
        router.push('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  // 檢查登入狀態
  const checkLoginStatus = async () => {
    try {
      // 先檢查 cookie 中是否有 token
      const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1');
      
      if (!token) {
        loginStatus.value = false;
        userInfo.value = null;
        localStorage.removeItem('userInfo');
        return false;
      }

      const res = await apiUserCheckSignin();
      const { data: { success, isAuthenticated, user } } = res;

      if (success && isAuthenticated) {
        loginStatus.value = true;
        userInfo.value = user;
        return true;
      } else {
        loginStatus.value = false;
        userInfo.value = null;
        localStorage.removeItem('userInfo');
        // 清除無效的 token
        document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = 'refresh_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        return false;
      }
    } catch (error) {
      console.error('Check login status failed:', error);
      loginStatus.value = false;
      userInfo.value = null;
      localStorage.removeItem('userInfo');
      return false;
    }
  };

  // 登出功能
  const logout = async () => {
    try {
      // 呼叫後端登出 API
      const response = await apiUserLogout();
      
      if (response.data?.success) {
        // 清除 cookie 中的 token
        document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = 'refresh_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = 'sessionid=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';

        // 清除用戶資訊
        userInfo.value = null;
        loginStatus.value = false;

        // 清除本地儲存的用戶相關資料
        localStorage.removeItem('userInfo');

        // 跳轉到首頁
        router.push('/');
        
        return true;
      } else {
        throw new Error(response.data?.message || '登出失敗');
      }
    } catch (error: any) {
      console.error('Logout failed:', error);
      // 即使 API 呼叫失敗，也清除本地資料
      userInfo.value = null;
      loginStatus.value = false;
      localStorage.removeItem('userInfo');
      document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = 'refresh_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = 'sessionid=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      
      // 跳轉到首頁
      router.push('/');
      
      throw error;
    }
  };

  return {
    userInfo,
    loginStatus,
    isLoading,
    signin,
    logout,
    checkLoginStatus,
  };
});
