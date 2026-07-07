import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#040404',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1px solid #1c1c1c',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #FF8008 0%, #FF4B2B 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            fontFamily: 'sans-serif',
          }}
        >
          A
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
