// Phira 官方 API 服务

export interface PhiraLoginRequest {
  email: string;
  password: string;
}

export interface PhiraLoginResponse {
  id: number;
  token: string;
  refreshToken: string;
  expireAt: string;
}

export interface PhiraLoginError {
  error: string;
}

export interface ChartInfo {
  id: number;
  name: string;
  level: string;
  difficulty: number;
  charter: string;
  composer: string;
  illustrator: string;
  description: string;
  ranked: boolean;
  reviewed: boolean;
  stable: boolean;
  illustration: string;
  preview: string;
  file: string;
  uploader: number;
  tags: string[];
  rating: number;
  ratingCount: number;
  created: string;
  updated: string;
  chartUpdated: string;
}

export interface RecordInfo {
  id: number;
  player: number;
  chart: number;
  score: number;
  accuracy: number;
  perfect: number;
  good: number;
  bad: number;
  miss: number;
  speed: number;
  max_combo: number;
  best: boolean;
  best_std: boolean;
  mods: number;
  full_combo: boolean;
  time: string;
  std: number | null;
  std_score: number | null;
}

const PHIRA_API_BASE = 'https://phira.5wyxi.com';

class PhiraApiService {
  private userToken: string = '';
  private userId: number = 0;

  setUserToken(token: string, userId: number = 0) {
    this.userToken = token;
    if (userId) this.userId = userId;
  }

  getUserToken(): string {
    return this.userToken;
  }

  getUserId(): number {
    return this.userId;
  }

  clearAuth() {
    this.userToken = '';
    this.userId = 0;
  }

  // 登录获取 token
  async login(email: string, password: string): Promise<PhiraLoginResponse> {
    const response = await fetch(`${PHIRA_API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      throw new Error(data.error || '登录失败');
    }

    this.setUserToken(data.token, data.id);
    return data;
  }

  // 获取谱面信息
  async getChartInfo(chartId: number): Promise<ChartInfo> {
    const response = await fetch(`${PHIRA_API_BASE}/chart/${chartId}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  }

  // 获取成绩信息
  async getRecordInfo(recordId: number): Promise<RecordInfo> {
    const response = await fetch(`${PHIRA_API_BASE}/record/${recordId}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  }

  // 批量获取谱面信息（带缓存）
  private chartCache: Map<number, ChartInfo> = new Map();
  
  async getChartInfoCached(chartId: number): Promise<ChartInfo | null> {
    if (this.chartCache.has(chartId)) {
      return this.chartCache.get(chartId)!;
    }
    
    try {
      const info = await this.getChartInfo(chartId);
      this.chartCache.set(chartId, info);
      return info;
    } catch {
      return null;
    }
  }

  // 批量获取成绩信息
  async getRecordInfoCached(recordId: number): Promise<RecordInfo | null> {
    try {
      return await this.getRecordInfo(recordId);
    } catch {
      return null;
    }
  }
}

export const phiraApiService = new PhiraApiService();
