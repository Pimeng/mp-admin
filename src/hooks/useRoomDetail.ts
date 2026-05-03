import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';
import { applyApiConfig } from '@/hooks/useApiConfig';
import { webSocketService } from '@/services/websocket';
import { toast } from 'sonner';
import type { Room } from '@/types/api';

// 房间日志条目(对齐 api.md / websocket.md 中 recent_logs / room_log 的 schema)
export interface RoomLogEntry {
  message: string;
  timestamp: number;
}

interface UseRoomDetailOptions {
  enableWebSocket?: boolean;
  onGameEnd?: (finishedPlayers: { userId: number; userName: string; recordId?: number }[]) => void;
}

export function useRoomDetail(roomId: string | undefined, options: UseRoomDetailOptions = {}) {
  const { enableWebSocket = true, onGameEnd } = options;

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [wsConnected, setWsConnected] = useState(false);
  const [wsSubscribed, setWsSubscribed] = useState(false);
  const [chatMessages, setChatMessages] = useState<RoomLogEntry[]>([]);

  const previousStateRef = useRef<string>('');
  const playerRecordsRef = useRef<Map<number, { userId: number; userName: string; recordId?: number }>>(new Map());

  // 获取房间详情
  const fetchRoomDetail = useCallback(async () => {
    if (!roomId) return;

    if (!apiService.getBaseUrl()) {
      applyApiConfig();
    }

    if (!apiService.getBaseUrl()) {
      setError('请先配置 API 地址');
      return null;
    }

    if (!apiService.hasAdminToken()) {
      setError('请先配置管理员 TOKEN');
      return null;
    }

    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getAdminRooms();
      if (data.ok) {
        const foundRoom = data.rooms.find(r => r.roomid === roomId);
        if (foundRoom) {
          setRoom(foundRoom);
          if (foundRoom.recent_logs) {
            setChatMessages(foundRoom.recent_logs.map(log => ({
              message: log.message,
              timestamp: log.timestamp,
            })));
          }
          return foundRoom;
        } else {
          setError('房间不存在');
          toast.error('房间不存在');
        }
      } else {
        const errorMsg = (data as { error?: string }).error || '获取房间信息失败';
        setError(errorMsg);
        toast.error('获取房间信息失败');
      }
    } catch {
      setError('请求失败，请检查 API 地址和 TOKEN');
      toast.error('请求失败，请检查 TOKEN 是否有效');
    } finally {
      setIsLoading(false);
    }
    return null;
  }, [roomId]);

  // 初始加载
  useEffect(() => {
    fetchRoomDetail();
  }, [fetchRoomDetail]);

  // 初始化状态引用
  useEffect(() => {
    if (room && previousStateRef.current !== room.state.type) {
      previousStateRef.current = room.state.type;
    }
  }, [room?.roomid, room?.state.type]);

  // WebSocket 连接和订阅
  useEffect(() => {
    if (!roomId || !enableWebSocket) return;

    if (!apiService.getBaseUrl()) {
      applyApiConfig();
    }

    const baseUrl = apiService.getBaseUrl();
    if (!baseUrl) return;

    webSocketService.setBaseUrl(baseUrl);

    webSocketService.connect().then(() => {
      webSocketService.adminSubscribe();
    }).catch((error) => {
      console.error('WebSocket connection failed:', error);
    });

    const unsubscribeConnect = webSocketService.onConnect(() => {
      setWsConnected(true);
      webSocketService.adminSubscribe();
    });

    const unsubscribeDisconnect = webSocketService.onDisconnect(() => {
      setWsConnected(false);
      setWsSubscribed(false);
    });

    const unsubscribeSubscribe = webSocketService.onSubscribe((success) => {
      setWsSubscribed(success);
      if (success) {
        toast.success('WebSocket 已连接');
      } else {
        toast.error('WebSocket 订阅失败，请检查管理员 Token');
      }
    });

    const unsubscribeMessage = webSocketService.onMessage((message) => {
      if (message.type === 'admin_update') {
        const adminMessage = message as unknown as { data: { changes: { rooms: Room[] } } };
        const updatedRoom = adminMessage.data.changes.rooms.find(r => r.roomid === roomId);
        if (updatedRoom) {
          handleRoomUpdate(updatedRoom);
        }
      }

      if (message.type === 'room_log') {
        const logMsg = message as unknown as { data: RoomLogEntry };
        setChatMessages(prev => [...prev, {
          message: logMsg.data.message,
          timestamp: logMsg.data.timestamp,
        }]);
      }
    });

    setWsConnected(webSocketService.isConnected());

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeSubscribe();
      unsubscribeMessage();
      webSocketService.adminUnsubscribe();
      previousStateRef.current = '';
      playerRecordsRef.current.clear();
    };
  }, [roomId, enableWebSocket]);

  // 处理房间更新
  const handleRoomUpdate = useCallback((updatedRoom: Room) => {
    const currentState = updatedRoom.state.type;

    // 收集玩家成绩
    if (currentState === 'playing') {
      updatedRoom.users.forEach(u => {
        if (u.record_id && !playerRecordsRef.current.has(u.id)) {
          playerRecordsRef.current.set(u.id, {
            userId: u.id,
            userName: u.name,
            recordId: u.record_id,
          });
        }
      });
    }

    const oldState = previousStateRef.current;
    previousStateRef.current = currentState;

    // 检测游戏结束
    if (oldState && oldState !== currentState) {
      if (oldState === 'playing' && (currentState === 'waiting' || currentState === 'select_chart')) {
        const finishedPlayers = Array.from(playerRecordsRef.current.values());
        if (finishedPlayers.length > 0 && onGameEnd) {
          onGameEnd(finishedPlayers);
        }
        playerRecordsRef.current.clear();
      }

      if (currentState === 'playing') {
        playerRecordsRef.current.clear();
      }
    }

    setRoom(updatedRoom);
  }, [onGameEnd]);

  // 发送房间消息
  const sendMessage = useCallback(async (message: string) => {
    if (!roomId || !message) return false;

    try {
      const result = await apiService.sendRoomChat(roomId, message);
      if (result.ok) {
        toast.success('消息已发送');
        return true;
      } else {
        toast.error('发送失败');
      }
    } catch {
      toast.error('请求失败');
    }
    return false;
  }, [roomId]);

  // 解散房间
  const disbandRoom = useCallback(async () => {
    if (!roomId) return false;

    try {
      const result = await apiService.disbandRoom(roomId);
      if (result.ok) {
        toast.success(`房间 ${roomId} 已解散`);
        return true;
      } else {
        toast.error('解散失败');
      }
    } catch {
      toast.error('请求失败');
    }
    return false;
  }, [roomId]);

  // 设置最大人数
  const setMaxUsers = useCallback(async (maxUsers: number) => {
    if (!roomId) return false;

    try {
      const result = await apiService.setRoomMaxUsers(roomId, maxUsers);
      if (result.ok) {
        toast.success(`最大人数已设置为 ${maxUsers}`);
        await fetchRoomDetail();
        return true;
      } else {
        toast.error('设置失败');
      }
    } catch {
      toast.error('请求失败');
    }
    return false;
  }, [roomId, fetchRoomDetail]);

  return {
    room,
    isLoading,
    error,
    wsConnected,
    wsSubscribed,
    chatMessages,
    fetchRoomDetail,
    sendMessage,
    disbandRoom,
    setMaxUsers,
  };
}
