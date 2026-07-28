import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = true,
    isLoading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={isLoading ? () => {} : onCancel} className="relative z-50">
            <div className="fixed inset-0 bg-ink-950/40 transition duration-100 data-[closed]:opacity-0" aria-hidden="true" />
            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="card w-full max-w-sm !rounded-2xl p-6 shadow-xl transition duration-100 ease-out
                    data-[closed]:scale-95 data-[closed]:opacity-0"
                >
                    <DialogTitle className="font-display text-lg font-semibold text-ink-900">{title}</DialogTitle>
                    {description && <Description className="mt-2 text-sm text-slate-500">{description}</Description>}
                    <div className="mt-6 flex justify-end gap-2">
                        <button type="button" onClick={onCancel} disabled={isLoading} className="btn-outline !px-4 !py-2">
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={
                                danger
                                    ? 'rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60'
                                    : 'btn-primary !px-4 !py-2 disabled:opacity-60'
                            }
                        >
                            {isLoading ? 'Please wait…' : confirmLabel}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
