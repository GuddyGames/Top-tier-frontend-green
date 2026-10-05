const API_URLS = (import.meta.env.VITE_API_URLS || import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .split(',').map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean);

async function request(path, options = {}) {
  const token = localStorage.getItem('topTierToken');
  let lastError;
  for (const baseUrl of API_URLS) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(data.error || data.message || `Request failed with status ${res.status}`);
        error.status = res.status;
        if (res.status >= 500 || res.status === 404) { lastError = error; continue; }
        throw error;
      }
      return data;
    } catch (error) {
      lastError = error;
      if (error?.status && error.status < 500 && error.status !== 404) throw error;
    }
  }
  throw lastError || new Error('Unable to reach the Top-tier backend.');
}

export const api = {
  signup:p=>request('/api/auth/signup',{method:'POST',body:JSON.stringify(p)}),
  login:p=>request('/api/auth/login',{method:'POST',body:JSON.stringify(p)}),
  googleLogin:(accessToken,referralCode='')=>request('/api/auth/google',{method:'POST',body:JSON.stringify({accessToken,referralCode})}),
  getLeaderboard:(limit=20,offset=0)=>request(`/api/leaderboard?limit=${limit}&offset=${offset}`),
  getDashboard:()=>request('/api/dashboard'), getMyDashboard:()=>request('/api/dashboard/me'), getMyProfile:()=>request('/api/profile/me'),
  updateMyProfile:p=>request('/api/profile/me',{method:'PATCH',body:JSON.stringify(p)}),
  updateNotificationPreference:enabled=>request('/api/profile/me/notifications',{method:'PATCH',body:JSON.stringify({enabled})}),
  getNotifications:()=>request('/api/profile/me/notifications'), markNotificationRead:id=>request(`/api/profile/me/notifications/${id}/read`,{method:'PATCH'}),
  acceptPrivacy:()=>request('/api/profile/me/privacy/accept',{method:'POST'}), getSupportChat:()=>request('/api/support/me'),
  sendSupportMessage:message=>request('/api/support/me/messages',{method:'POST',body:JSON.stringify({message})}), getMyReferral:()=>request('/api/referral/me'),
  startTelegramVerification:()=>request('/api/telegram/verification/start',{method:'POST'}), startTelegramTask:id=>request(`/api/telegram/tasks/${id}/start`,{method:'POST'}),
  getTelegramVerificationStatus:()=>request('/api/telegram/verification/status'), getTasks:()=>request('/api/tasks'), getMyTaskSubmissions:()=>request('/api/tasks/me'),
  submitTask:(taskId,{proofFile,proofUrl}={})=>{const body=new FormData();if(proofFile)body.append('proof',proofFile);if(proofUrl)body.append('proofUrl',proofUrl);return request(`/api/tasks/${taskId}/submit`,{method:'POST',body});},
  getDemoPrices:()=>request('/api/demo/prices'), getDemoCandles:(symbol,hours=4,interval=1)=>request(`/api/demo/prices/${encodeURIComponent(symbol)}/candles?hours=${hours}&interval=${interval}`),
  getDemoAccount:()=>request('/api/demo/account'),getDemoPerformance:()=>request('/api/demo/performance'),getDemoTrades:()=>request('/api/demo/trades'),
  openDemoTrade:p=>request('/api/demo/trades',{method:'POST',body:JSON.stringify(p)}),closeDemoTrade:id=>request(`/api/demo/trades/${id}/close`,{method:'POST'}),
  adminGetReferrals:()=>request('/api/admin/referrals'),adminGetSupport:()=>request('/api/admin/support'),adminGetSupportChat:id=>request(`/api/support/admin/${id}`),
  adminSendSupportMessage:(id,message)=>request(`/api/support/admin/${id}/messages`,{method:'POST',body:JSON.stringify({message})}),adminSendNotification:(title,message)=>request('/api/admin/notifications',{method:'POST',body:JSON.stringify({title,message})}),
  adminListUsers:(search='')=>request(`/api/admin/users${search?`?search=${encodeURIComponent(search)}`:''}`),adminGetUser:id=>request(`/api/admin/users/${id}`),
  adminSetStatus:(id,status)=>request(`/api/admin/users/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}),adminUpdateContribution:(id,contribution)=>request(`/api/admin/users/${id}/contribution`,{method:'PATCH',body:JSON.stringify({contribution})}),
  adminDeleteUser:id=>request(`/api/admin/users/${id}`,{method:'DELETE'}),adminScoreUser:(id,points,note)=>request(`/api/admin/users/${id}/score`,{method:'POST',body:JSON.stringify({points,note})}),
  adminUpdateProfile:(id,fields)=>request(`/api/admin/users/${id}`,{method:'PATCH',body:JSON.stringify(fields)}),adminGetActivity:(limit=50)=>request(`/api/admin/activity?limit=${limit}`),
  adminGetTrades:status=>request(`/api/admin/trades${status?`?status=${status}`:''}`),adminGetPendingSubmissions:()=>request('/api/admin/tasks/pending'),
  adminGetSubmissions:({status='pending',search='',limit=50,offset=0}={})=>{const p=new URLSearchParams({status,limit:String(limit),offset:String(offset)});if(search)p.set('search',search);return request(`/api/admin/submissions?${p}`);},
  adminReviewSubmission:(id,status)=>request(`/api/tasks/submissions/${id}`,{method:'PATCH',body:JSON.stringify({status})}),adminCreateTask:p=>request('/api/tasks',{method:'POST',body:JSON.stringify(p)}),adminDeactivateTask:id=>request(`/api/tasks/${id}/deactivate`,{method:'PATCH'}),adminGetOutstandingTasks:()=>request('/api/admin/tasks/outstanding'),
};
