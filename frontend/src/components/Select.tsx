import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

export interface SelectOption<T extends string | number> {
    value: T;
    label: string;
}

interface SelectProps<T extends string | number> {
    value: T;
    onChange: (value: T) => void;
    options: SelectOption<T>[];
    className?: string;
}

// A styled drop-in replacement for <select> — the native element's open
// option list can't be restyled with CSS in any browser, so this uses
// Headless UI's Listbox (real DOM, real styles) instead while keeping the
// same controlled value/onChange shape.
export default function Select<T extends string | number>({
    value,
    onChange,
    options,
    className = '',
}: SelectProps<T>) {
    const selected = options.find((option) => option.value === value);

    return (
        <Listbox value={value} onChange={onChange}>
            <div className="relative inline-block">
                <ListboxButton className={`input flex items-center justify-between gap-2 text-left ${className}`}>
                    <span className="truncate">{selected?.label ?? ''}</span>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4 shrink-0 text-slate-400"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </ListboxButton>
                <ListboxOptions
                    transition
                    className="absolute z-20 mt-2 max-h-60 w-full min-w-max overflow-auto rounded-xl border
                    border-slate-200 bg-white py-1 shadow-lg transition duration-100 ease-out focus:outline-none
                    data-[closed]:scale-95 data-[closed]:opacity-0"
                >
                    {options.map((option) => (
                        <ListboxOption
                            key={option.value}
                            value={option.value}
                            className="group flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2
                            text-sm text-ink-900 select-none data-[focus]:bg-brand-50 data-[focus]:text-brand-700"
                        >
                            <span className="group-data-[selected]:font-semibold">{option.label}</span>
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="hidden h-4 w-4 shrink-0 text-brand-600 group-data-[selected]:block"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
    );
}
