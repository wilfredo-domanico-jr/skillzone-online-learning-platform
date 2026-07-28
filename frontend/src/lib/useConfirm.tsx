import { useCallback, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    danger?: boolean;
}

// Renders a shared ConfirmDialog and hands back a `requestConfirm` you can
// drop into any onClick in place of firing a mutation immediately.
export function useConfirm() {
    const [pending, setPending] = useState<{ options: ConfirmOptions; onConfirm: () => void } | null>(null);

    const requestConfirm = useCallback((options: ConfirmOptions, onConfirm: () => void) => {
        setPending({ options, onConfirm });
    }, []);

    const dialog = (
        <ConfirmDialog
            open={pending !== null}
            title={pending?.options.title ?? ''}
            description={pending?.options.description}
            confirmLabel={pending?.options.confirmLabel}
            danger={pending?.options.danger}
            onConfirm={() => {
                pending?.onConfirm();
                setPending(null);
            }}
            onCancel={() => setPending(null)}
        />
    );

    return { requestConfirm, confirmDialog: dialog };
}
