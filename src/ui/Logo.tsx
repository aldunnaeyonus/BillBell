import React from 'react';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export const Logo = ({ width = 100, height = 100 }) => (
  <Svg width={width} height={height} viewBox="0 0 512 512" fill="none">
    <Defs>
      <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#005C97" stopOpacity="1" />
        <Stop offset="1" stopColor="#E0AA3E" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    
    {/* Waves */}
    <Path d="M110 160 C 80 200, 80 312, 110 352" stroke="url(#grad)" strokeWidth="32" strokeLinecap="round" />
    <Path d="M60 120 C 10 190, 10 390, 60 460" stroke="url(#grad)" strokeWidth="32" strokeLinecap="round" opacity="0.6" />
    <Path d="M402 160 C 432 200, 432 312, 402 352" stroke="url(#grad)" strokeWidth="32" strokeLinecap="round" />
    <Path d="M452 120 C 502 190, 502 390, 452 460" stroke="url(#grad)" strokeWidth="32" strokeLinecap="round" opacity="0.6" />

    {/* Bell */}
    <Path d="M256 64 C 200 64, 160 110, 160 192 L 160 320 L 128 352 L 384 352 L 352 320 L 352 192 C 352 110, 312 64, 256 64 Z" fill="url(#grad)" />
    
    {/* Clapper */}
    <Circle cx="256" cy="400" r="32" fill="url(#grad)" />

    {/* Checkmark */}
    <Path d="M200 240 L 240 280 L 320 180" stroke="#FFFFFF" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);