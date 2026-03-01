import Swal from 'sweetalert2';

export interface ConfirmDialogOptions {
  title: string;
  text?: string;
  icon?: 'warning' | 'error' | 'success' | 'info' | 'question';
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
}

export async function confirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title,
    text: options.text,
    icon: options.icon || 'warning',
    showCancelButton: true,
    confirmButtonColor: options.confirmButtonColor || '#dc2626',
    cancelButtonColor: options.cancelButtonColor || '#6b7280',
    confirmButtonText: options.confirmButtonText || '确认',
    cancelButtonText: options.cancelButtonText || '取消',
  });

  return result.isConfirmed;
}

export interface InputDialogOptions {
  title: string;
  inputLabel?: string;
  inputValue?: string;
  inputAttributes?: Record<string, string>;
  confirmButtonText?: string;
  cancelButtonText?: string;
  inputValidator?: (value: string) => string | null;
}

export async function inputDialog(options: InputDialogOptions): Promise<{ isConfirmed: boolean; value?: string }> {
  const result = await Swal.fire({
    title: options.title,
    input: 'text',
    inputLabel: options.inputLabel,
    inputValue: options.inputValue,
    inputAttributes: options.inputAttributes,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || '确认',
    cancelButtonText: options.cancelButtonText || '取消',
    inputValidator: options.inputValidator,
  });

  return {
    isConfirmed: result.isConfirmed,
    value: result.value as string | undefined,
  };
}

export interface NumberInputDialogOptions {
  title: string;
  inputLabel?: string;
  inputValue?: number;
  min?: number;
  max?: number;
  step?: number;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export async function numberInputDialog(options: NumberInputDialogOptions): Promise<{ isConfirmed: boolean; value?: number }> {
  const result = await Swal.fire({
    title: options.title,
    input: 'number',
    inputLabel: options.inputLabel,
    inputValue: options.inputValue?.toString(),
    inputAttributes: {
      min: options.min?.toString() || '0',
      max: options.max?.toString() || '100',
      step: options.step?.toString() || '1',
    },
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || '确认',
    cancelButtonText: options.cancelButtonText || '取消',
    inputValidator: (value) => {
      if (!value) {
        return '请输入数值';
      }
      const num = parseFloat(value);
      if (options.min !== undefined && num < options.min) {
        return `数值不能小于 ${options.min}`;
      }
      if (options.max !== undefined && num > options.max) {
        return `数值不能大于 ${options.max}`;
      }
      return null;
    },
  });

  return {
    isConfirmed: result.isConfirmed,
    value: result.value ? parseFloat(result.value as string) : undefined,
  };
}

export async function disbandRoomDialog(roomId: string): Promise<boolean> {
  return confirmDialog({
    title: '确认解散房间?',
    text: `您确定要解散房间 ${roomId} 吗？此操作不可撤销！`,
    icon: 'warning',
    confirmButtonText: '确认解散',
  });
}

export async function maxUsersDialog(currentValue: number): Promise<{ isConfirmed: boolean; value?: number }> {
  return numberInputDialog({
    title: '修改最大人数',
    inputLabel: '请输入新的最大人数',
    inputValue: currentValue,
    min: 1,
    max: 64,
    step: 1,
  });
}
