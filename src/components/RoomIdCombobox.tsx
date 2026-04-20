import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Room } from '@/types/api';

interface RoomIdComboboxProps {
  value: string;
  rooms: Room[];
  loading?: boolean;
  placeholder?: string;
  emptyText?: string;
  onValueChange: (value: string) => void;
  onOpen?: () => void | Promise<void>;
}

export function RoomIdCombobox({
  value,
  rooms,
  loading = false,
  placeholder = '\u8f93\u5165\u6216\u9009\u62e9\u623f\u95f4 ID',
  emptyText = '\u6ca1\u6709\u5339\u914d\u7684\u623f\u95f4',
  onValueChange,
  onOpen,
}: RoomIdComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const keyword = value.trim().toLowerCase();
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastKeywordRef = useRef(keyword);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (!keyword) {
        return true;
      }

      return (
        room.roomid.toLowerCase().includes(keyword) ||
        (room.host?.name || '').toLowerCase().includes(keyword)
      );
    });
  }, [rooms, keyword]);

  const handleOpen = () => {
    setOpen(true);
    void onOpen?.();
  };

  const handleSelect = (roomId: string) => {
    onValueChange(roomId);
    setOpen(false);
    setHighlightedIndex(-1);
  };

  useEffect(() => {
    if (!open) {
      setHighlightedIndex(-1);
      lastKeywordRef.current = keyword;
      return;
    }

    if (filteredRooms.length === 0) {
      setHighlightedIndex(-1);
      lastKeywordRef.current = keyword;
      return;
    }

    const keywordChanged = lastKeywordRef.current !== keyword;
    const selectedIndex = filteredRooms.findIndex((room) => room.roomid === value);

    if (highlightedIndex < 0 || keywordChanged) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    } else if (highlightedIndex >= filteredRooms.length) {
      setHighlightedIndex(filteredRooms.length - 1);
    }

    lastKeywordRef.current = keyword;
  }, [open, keyword, value, filteredRooms, highlightedIndex]);

  useEffect(() => {
    if (highlightedIndex < 0) {
      return;
    }

    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const moveHighlight = (direction: 1 | -1) => {
    if (filteredRooms.length === 0) {
      return;
    }

    setHighlightedIndex((prev) => {
      if (prev < 0) {
        return direction === 1 ? 0 : filteredRooms.length - 1;
      }

      return (prev + direction + filteredRooms.length) % filteredRooms.length;
    });
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const shouldIntercept =
      event.key === 'Tab' ||
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter';

    if (!shouldIntercept) {
      return;
    }

    if (!open) {
      handleOpen();
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
      return;
    }

    if (event.key === 'Tab') {
      if (filteredRooms.length === 0) {
        return;
      }

      event.preventDefault();
      moveHighlight(event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === 'Enter' && highlightedIndex >= 0 && filteredRooms[highlightedIndex]) {
      event.preventDefault();
      handleSelect(filteredRooms[highlightedIndex].roomid);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value);
            setOpen(true);
          }}
          onFocus={handleOpen}
          onKeyDown={handleInputKeyDown}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => {
            const nextOpen = !open;
            setOpen(nextOpen);
            if (nextOpen) {
              void onOpen?.();
            }
          }}
        >
          <ChevronsUpDown className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover p-1 shadow-md">
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {'\u6b63\u5728\u52a0\u8f7d\u623f\u95f4\u5217\u8868...'}
              </div>
            ) : filteredRooms.length > 0 ? (
              filteredRooms.map((room, index) => (
                <button
                  key={room.roomid}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                    highlightedIndex === index && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => handleSelect(room.roomid)}
                  onMouseEnter={() => {
                    setHighlightedIndex(index);
                  }}
                >
                  <Check className={cn('h-4 w-4', value === room.roomid ? 'opacity-100' : 'opacity-0')} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{room.roomid}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {'\u623f\u4e3b: '} {room.host?.name || '\u672a\u77e5'}{' '}
                      {room.host?.id ? `(ID: ${room.host.id})` : ''}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-muted-foreground">{emptyText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
