import React from 'react';

export default function AvatarFace({ size = 60, gender = 'female' }) {
  const avatarSrc = gender === 'male' ? '/avatars/male.png' : '/avatars/female.png';
  const sizePx = `${size}px`;

  return (
    <div
      style={{
        width: sizePx,
        height: sizePx,
        minWidth: sizePx,
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        isolation: 'isolate',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: `calc(${sizePx} * -0.055)`,
          borderRadius: '22%',
          background: `
            radial-gradient(circle at 50% 50%, color-mix(in srgb, #f8c96b, transparent 54%), transparent 62%),
            conic-gradient(from 160deg, transparent 0 14%, #f8c96b, transparent 44% 62%, #f8c96b, transparent 88%)
          `,
          filter: `blur(calc(${sizePx} * 0.02))`,
          opacity: 0.82,
          zIndex: -1,
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '12%',
          background: '#111827',
          border: '1px solid color-mix(in srgb, #f8c96b, #111827 48%)',
          boxShadow: `
            0 calc(${sizePx} * .08) calc(${sizePx} * .24) rgba(2, 6, 23, .34),
            inset 0 calc(${sizePx} * .01) calc(${sizePx} * .08) rgba(255,255,255,.18)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={avatarSrc}
          alt="AI Avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div
          style={{
            position: 'absolute',
            left: '5%',
            bottom: '4%',
            padding: '.18em .58em .24em',
            borderRadius: '999px',
            background: 'rgba(255, 250, 214, .84)',
            color: '#3f3412',
            fontFamily: 'monospace',
            fontSize: `calc(${sizePx} * .15)`,
            fontWeight: 800,
            opacity: 0.9,
          }}
        >
          Admin
        </div>
      </div>
    </div>
  );
}
