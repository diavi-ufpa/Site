'use client';

import React from 'react';

export default function TabContentSkeleton() {
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .skeletonBox {
          background: linear-gradient(90deg, #f0f2f5 25%, #e6e8ec 37%, #f0f2f5 63%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }
      `}</style>

      {/* Grid com cards de gráficos (padrão de 2 colunas no desktop) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          width: '100%',
        }}
      >
        {[
          [65, 85, 45, 95, 70, 55, 80],
          [75, 50, 90, 65, 80, 40, 85],
        ].map((bars, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              minHeight: '380px',
            }}
          >
            {/* Header do Card (Título do gráfico + indicador) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                className="skeletonBox"
                style={{ width: '55%', height: '20px', borderRadius: '6px' }}
              />
              <div
                className="skeletonBox"
                style={{ width: '22%', height: '16px', borderRadius: '4px' }}
              />
            </div>

            {/* Simulação de barras do gráfico */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-around',
                flex: 1,
                padding: '1.5rem 0.5rem 0 0.5rem',
                borderBottom: '2px solid #f3f4f6',
                gap: '0.75rem',
                minHeight: '220px',
              }}
            >
              {bars.map((h, bIdx) => (
                <div
                  key={bIdx}
                  className="skeletonBox"
                  style={{
                    width: '100%',
                    maxWidth: '38px',
                    height: `${h}%`,
                    borderRadius: '6px 6px 0 0',
                  }}
                />
              ))}
            </div>

            {/* Simulação do eixo X */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                gap: '0.75rem',
                paddingTop: '0.25rem',
              }}
            >
              {bars.map((_, bIdx) => (
                <div
                  key={bIdx}
                  className="skeletonBox"
                  style={{ width: '28px', height: '10px', borderRadius: '4px' }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Card inferior: Simulação de Tabela Descritiva ou Gráfico Complementar */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          minHeight: '200px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            className="skeletonBox"
            style={{ width: '40%', height: '20px', borderRadius: '6px' }}
          />
          <div
            className="skeletonBox"
            style={{ width: '15%', height: '16px', borderRadius: '4px' }}
          />
        </div>

        {/* Linhas simulando tabela / estatísticas */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginTop: '0.5rem',
          }}
        >
          <div
            className="skeletonBox"
            style={{ width: '100%', height: '36px', borderRadius: '6px' }}
          />
          <div
            className="skeletonBox"
            style={{ width: '100%', height: '32px', borderRadius: '6px' }}
          />
          <div
            className="skeletonBox"
            style={{ width: '100%', height: '32px', borderRadius: '6px' }}
          />
        </div>
      </div>
    </div>
  );
}
