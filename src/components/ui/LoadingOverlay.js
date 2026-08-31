'use client';

export default function LoadingOverlay({ isFullScreen = false, message = "Carregando..." }) {
  return (
    <>
      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        position: isFullScreen ? 'fixed' : 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        flexDirection: 'column', zIndex: 50,
        backdropFilter: 'blur(2px)',
        borderRadius: isFullScreen ? 0 : '12px',
        pointerEvents: 'all',
      }}>
        <div style={{
          width: 44, height: 44,
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #FF8E29', // Cor institucional DIAVI
          borderRadius: '50%',
          animation: 'spin 0.85s linear infinite',
          marginBottom: '0.75rem'
        }} />
        <p style={{ color: '#374151', fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{message}</p>
      </div>
    </>
  );
}