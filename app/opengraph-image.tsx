import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Waar kan ik het kijken? - Streaming Zoekmachine';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #10131a, #181c27)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '40px',
          textAlign: 'center',
          border: '4px solid #232838',
        }}
      >
        {/* Badge boven de titel */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            borderRadius: '9999px',
            padding: '8px 20px',
            marginBottom: '24px',
            color: '#00f2fe',
            fontSize: 20,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}
        >
          Streaming Zoekmachine
        </div>

        {/* Hoofdtitel */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: '#f3f1ea',
            lineHeight: 1.1,
            marginBottom: '20px',
            backgroundImage: 'linear-gradient(to right, #00f2fe, #5eead4, #3b82f6)',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          Waar kan ik het kijken?
        </div>

        {/* Ondertitel */}
        <div
          style={{
            fontSize: 28,
            color: '#9096a8',
            maxWidth: '800px',
            lineHeight: 1.4,
          }}
        >
          Vind direct op welke streamingdienst jouw favoriete film of serie staat.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}