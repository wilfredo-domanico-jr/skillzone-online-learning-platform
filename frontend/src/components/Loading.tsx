interface LoadingProps {
    label?: string;
    className?: string;
}

export default function Loading({ label = 'Loading…', className = '' }: LoadingProps) {
    return <p className={className ? `text-slate-500 ${className}` : 'text-slate-500'}>{label}</p>;
}
