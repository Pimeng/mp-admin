import { CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import { getConnectionStatusConfig, getWebSocketStatusConfig } from '@/lib/ui-helpers';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusProps {
  connected: boolean;
  showIconOnly?: boolean;
}

export function ConnectionStatus({ connected, showIconOnly = false }: ConnectionStatusProps) {
  const config = getConnectionStatusConfig(connected);
  
  if (showIconOnly) {
    return connected ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    );
  }

  return (
    <span className={`text-xs ${config.color}`}>
      {config.label}
    </span>
  );
}

interface WebSocketStatusProps {
  wsSubscribed: boolean;
  wsConnected: boolean;
}

export function WebSocketStatus({ wsSubscribed, wsConnected }: WebSocketStatusProps) {
  const config = getWebSocketStatusConfig(wsSubscribed, wsConnected);
  const Icon = config.icon === 'wifi' ? Wifi : WifiOff;

  return (
    <Badge variant="outline" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
