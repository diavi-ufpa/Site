'use client';

import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .skeletonBox {
          background: linear-gradient(90deg, #f0f2f5 25%, #e6e8ec 37%, #f0f2f5 63%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Cards de Estatísticas Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {[1, 2, 3].map((idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div className="skeletonBox" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
            <div className="skeletonBox" style={{ width: '60%', height: '14px' }} />
            <div className="skeletonBox" style={{ width: '40%', height: '32px' }} />
          </div>
        ))}
      </div>

      {/* Abas Skeleton */}
      <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="skeletonBox"
            style={{ width: '130px', height: '36px', borderRadius: '20px' }}
          />
        ))}
      </div>

      {/* Gráfico / Conteúdo Skeleton */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          minHeight: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeletonBox" style={{ width: '220px', height: '22px' }} />
          <div className="skeletonBox" style={{ width: '100px', height: '18px' }} />
        </div>
        <div className="skeletonBox" style={{ width: '100%', flex: 1, minHeight: '280px', borderRadius: '12px' }} />
      </div>
    </div>
  );
}
