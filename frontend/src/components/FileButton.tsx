import { useRef } from 'react';

interface FileButtonProps {
    label: string;
    onSelect: (file: File) => void;
    accept?: string;
    disabled?: boolean;
    variant?: 'outline' | 'dark';
}

// A styled trigger for a hidden native file input — the raw <input
// type="file"> renders as a tiny, browser-default "Choose File" control
// that's easy to miss and impossible to restyle directly.
export default function FileButton({ label, onSelect, accept, disabled, variant = 'outline' }: FileButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className={`${variant === 'dark' ? 'btn-dark' : 'btn-outline'} !px-3 !py-1.5 !text-xs`}
            >
                {label}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                disabled={disabled}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onSelect(file);
                    // Reset so selecting the same file again still fires onChange.
                    e.target.value = '';
                }}
                className="hidden"
            />
        </>
    );
}
