import type { 
  ApiConfig, 
  Room, 
  PublicRoom, 
  UserInfo, 
  ReplayAuthResponse, 
  OtpRequestResponse, 
  OtpVerifyResponse 
} from '@/types/api';

class ApiService {
  private config: ApiConfig = { baseUrl: '', adminToken: '' };

  setConfig(config: ApiConfig) {
    this.config = config;
  }

  getConfig(): ApiConfig {
    return this.config;
  }

  isConfigured(): boolean {
    return !!this.config.baseUrl;
  }

  hasAdminToken(): boolean {
    return !!this.config.adminToken;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.config.adminToken) {
      headers['X-Admin-Token'] = this.config.adminToken;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.config.baseUrl) {
      throw new Error('API 地址未配置');
    }
    
    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });
    
    const data = await response.json();
    return data;
  }

  // ========== 公共接口 ==========
  
  // 获取房间列表
  async getRooms(): Promise<{ rooms: PublicRoom[]; total: number }> {
    return this.request('/room');
  }

  // 回放认证
  async replayAuth(token: string): Promise<ReplayAuthResponse> {
    return this.request('/replay/auth', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // 下载回放文件
  getReplayDownloadUrl(sessionToken: string, chartId: number, timestamp: number): string {
    return `${this.config.baseUrl}/replay/download?sessionToken=${sessionToken}&chartId=${chartId}&timestamp=${timestamp}`;
  }

  // 删除回放
  async deleteReplay(sessionToken: string, chartId: number, timestamp: number): Promise<{ ok: boolean }> {
    return this.request('/replay/delete', {
      method: 'POST',
      body: JSON.stringify({ sessionToken, chartId, timestamp }),
    });
  }

  // ========== OTP 认证 ==========

  // 请求OTP
  async requestOtp(): Promise<OtpRequestResponse> {
    return this.request('/admin/otp/request', {
      method: 'POST',
    });
  }

  // 验证OTP
  async verifyOtp(ssid: string, otp: string): Promise<OtpVerifyResponse> {
    return this.request('/admin/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ ssid, otp }),
    });
  }

  // ========== 管理员接口 ==========

  // 获取所有房间详情
  async getAdminRooms(): Promise<{ ok: boolean; rooms: Room[] }> {
    return this.request('/admin/rooms');
  }

  // 修改房间最大人数
  async setRoomMaxUsers(roomId: string, maxUsers: number): Promise<{ ok: boolean; roomid: string; max_users: number }> {
    return this.request(`/admin/rooms/${roomId}/max_users`, {
      method: 'POST',
      body: JSON.stringify({ maxUsers }),
    });
  }

  // 解散房间
  async disbandRoom(roomId: string): Promise<{ ok: boolean; roomid: string }> {
    return this.request(`/admin/rooms/${roomId}/disband`, {
      method: 'POST',
    });
  }

  // 获取回放配置
  async getReplayConfig(): Promise<{ ok: boolean; enabled: boolean }> {
    return this.request('/admin/replay/config');
  }

  // 设置回放配置
  async setReplayConfig(enabled: boolean): Promise<{ ok: boolean; enabled: boolean }> {
    return this.request('/admin/replay/config', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  // 获取房间创建配置
  async getRoomCreationConfig(): Promise<{ ok: boolean; enabled: boolean }> {
    return this.request('/admin/room-creation/config');
  }

  // 设置房间创建配置
  async setRoomCreationConfig(enabled: boolean): Promise<{ ok: boolean; enabled: boolean }> {
    return this.request('/admin/room-creation/config', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  // 查询用户信息
  async getUser(userId: number): Promise<{ ok: boolean; user: UserInfo }> {
    return this.request(`/admin/users/${userId}`);
  }

  // 封禁/解封用户
  async banUser(userId: number, banned: boolean, disconnect: boolean = true): Promise<{ ok: boolean }> {
    return this.request('/admin/ban/user', {
      method: 'POST',
      body: JSON.stringify({ userId, banned, disconnect }),
    });
  }

  // 房间级封禁
  async banRoomUser(userId: number, roomId: string, banned: boolean): Promise<{ ok: boolean }> {
    return this.request('/admin/ban/room', {
      method: 'POST',
      body: JSON.stringify({ userId, roomId, banned }),
    });
  }

  // 断开玩家连接
  async disconnectUser(userId: number): Promise<{ ok: boolean }> {
    return this.request(`/admin/users/${userId}/disconnect`, {
      method: 'POST',
    });
  }

  // 转移玩家
  async moveUser(userId: number, roomId: string, monitor: boolean = false): Promise<{ ok: boolean }> {
    return this.request(`/admin/users/${userId}/move`, {
      method: 'POST',
      body: JSON.stringify({ roomId, monitor }),
    });
  }

  // 全服广播
  async broadcast(message: string): Promise<{ ok: boolean; rooms: number }> {
    return this.request('/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // 向指定房间发送消息
  async sendRoomChat(roomId: string, message: string): Promise<{ ok: boolean }> {
    return this.request(`/admin/rooms/${roomId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // ========== 比赛房间 ==========

  // 配置比赛房间
  async configContestRoom(roomId: string, enabled: boolean, whitelist: number[]): Promise<{ ok: boolean }> {
    return this.request(`/admin/contest/rooms/${roomId}/config`, {
      method: 'POST',
      body: JSON.stringify({ enabled, whitelist }),
    });
  }

  // 更新白名单
  async updateWhitelist(roomId: string, userIds: number[]): Promise<{ ok: boolean }> {
    return this.request(`/admin/contest/rooms/${roomId}/whitelist`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  }

  // 开始比赛
  async startContest(roomId: string, force: boolean = false): Promise<{ ok: boolean }> {
    return this.request(`/admin/contest/rooms/${roomId}/start`, {
      method: 'POST',
      body: JSON.stringify({ force }),
    });
  }
}

export const apiService = new ApiService();
