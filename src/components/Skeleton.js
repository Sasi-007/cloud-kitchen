export function SkeletonLine({ width='100%',height=14,radius=8,style={}}) {
    return (
        <div style={{ width, height, borderRadius: radius, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',...style,}} />
    );
}

export function SkeletonCard({ lines = 3 }) {
    return (
        <div style={{ background: '#fff', borderRadius: 14, padding: '16px 18px', marginBottom: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)'}}>
            <SkeletonLine width="60%" height={16} style={{marginBottom: 10}} />
                {Array.from({ length: lines-1 }).map((_,i) => (<SkeletonLine key={i} width={i === lines - 2 ? '40%' : '90%'} height={12} style={{ marginBottom: 8 }} />))}
        </div>
    );
}

export function SkeletonStats({ count = 4 }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap:12, marginBottom: 24 }}>
            {Array.from({ length: count }).map((_,i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '18px 16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)'}}>
                    <SkeletonLine width="50%" height={28} style={{ marginBottom: 8 }} />
                    <SkeletonLine width="70%" height={12} />
                </div>
            ))}
        </div>
    );
}

export const shimmerCSS = `
@keyframers shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
`;