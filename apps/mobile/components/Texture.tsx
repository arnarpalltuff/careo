import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Path, Defs, Pattern, Rect, G, Line } from 'react-native-svg';

// ─── Grain Overlay ─────────────────────────────────────────────────
// Subtle film-grain effect that sits on top of backgrounds
export function GrainOverlay({ opacity = 0.03 }: { opacity?: number }) {
  return (
    <View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="grain" width={4} height={4} patternUnits="userSpaceOnUse">
            <Circle cx={1} cy={1} r={0.5} fill="#000" opacity={0.4} />
            <Circle cx={3} cy={3} r={0.3} fill="#000" opacity={0.2} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grain)" />
      </Svg>
    </View>
  );
}

// ─── Dot Grid ──────────────────────────────────────────────────────
// Subtle repeating dot pattern — great for card backgrounds
export function DotGrid({ color = '#1B6B5F', opacity = 0.04, spacing = 20 }: {
  color?: string; opacity?: number; spacing?: number;
}) {
  return (
    <View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="dots" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
            <Circle cx={spacing / 2} cy={spacing / 2} r={1.2} fill={color} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>
    </View>
  );
}

// ─── Topographic Lines ─────────────────────────────────────────────
// Organic flowing contour lines — signature Careo texture
export function TopoLines({ color = '#1B6B5F', opacity = 0.04, variant = 'default' }: {
  color?: string; opacity?: number; variant?: 'default' | 'dense' | 'wide';
}) {
  const gap = variant === 'dense' ? 16 : variant === 'wide' ? 32 : 22;

  return (
    <View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
        <G stroke={color} strokeWidth={1.2} fill="none">
          {/* Organic flowing contour lines */}
          <Path d={`M-20,${gap * 1} Q100,${gap * 1 - 15} 200,${gap * 1 + 10} T420,${gap * 1 - 5}`} />
          <Path d={`M-20,${gap * 3} Q80,${gap * 3 + 20} 180,${gap * 3 - 8} T420,${gap * 3 + 15}`} />
          <Path d={`M-20,${gap * 5} Q120,${gap * 5 - 25} 220,${gap * 5 + 12} T420,${gap * 5 - 10}`} />
          <Path d={`M-20,${gap * 7} Q90,${gap * 7 + 18} 200,${gap * 7 - 15} T420,${gap * 7 + 8}`} />
          <Path d={`M-20,${gap * 9} Q110,${gap * 9 - 12} 210,${gap * 9 + 20} T420,${gap * 9 - 5}`} />
          <Path d={`M-20,${gap * 11} Q70,${gap * 11 + 25} 190,${gap * 11 - 10} T420,${gap * 11 + 18}`} />
          <Path d={`M-20,${gap * 13} Q130,${gap * 13 - 20} 230,${gap * 13 + 8} T420,${gap * 13 - 12}`} />
          <Path d={`M-20,${gap * 15} Q85,${gap * 15 + 15} 200,${gap * 15 - 18} T420,${gap * 15 + 10}`} />
          <Path d={`M-20,${gap * 17} Q115,${gap * 17 - 10} 215,${gap * 17 + 22} T420,${gap * 17 - 8}`} />
          <Path d={`M-20,${gap * 19} Q95,${gap * 19 + 12} 195,${gap * 19 - 14} T420,${gap * 19 + 16}`} />
          <Path d={`M-20,${gap * 21} Q105,${gap * 21 - 18} 205,${gap * 21 + 10} T420,${gap * 21 - 6}`} />
          <Path d={`M-20,${gap * 23} Q75,${gap * 23 + 22} 185,${gap * 23 - 12} T420,${gap * 23 + 14}`} />
          <Path d={`M-20,${gap * 25} Q125,${gap * 25 - 16} 225,${gap * 25 + 18} T420,${gap * 25 - 10}`} />
        </G>
      </Svg>
    </View>
  );
}

// ─── Cross-Hatch ───────────────────────────────────────────────────
// Fine diagonal lines — works well on hero sections
export function CrossHatch({ color = '#fff', opacity = 0.03, spacing = 12 }: {
  color?: string; opacity?: number; spacing?: number;
}) {
  return (
    <View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="crosshatch" width={spacing} height={spacing} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Line x1={0} y1={0} x2={0} y2={spacing} stroke={color} strokeWidth={0.8} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#crosshatch)" />
      </Svg>
    </View>
  );
}

// ─── Organic Blobs ─────────────────────────────────────────────────
// Soft organic shapes for background decoration
export function OrganicBlobs({ color = '#1B6B5F', opacity = 0.03 }: {
  color?: string; opacity?: number;
}) {
  return (
    <View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Path
          d="M340,80 C380,120 360,200 300,220 C240,240 200,180 160,200 C120,220 140,300 100,280 C60,260 20,200 60,160 C100,120 200,60 260,40 C320,20 300,40 340,80Z"
          fill={color}
        />
        <Path
          d="M60,400 C100,360 180,380 200,420 C220,460 160,520 120,540 C80,560 20,520 10,480 C0,440 20,440 60,400Z"
          fill={color}
        />
        <Path
          d="M300,500 C360,480 400,540 380,600 C360,660 300,680 260,660 C220,640 240,580 260,540 C280,500 280,510 300,500Z"
          fill={color}
        />
        <Path
          d="M150,650 C200,620 260,660 240,720 C220,780 160,800 120,770 C80,740 100,680 150,650Z"
          fill={color}
        />
      </Svg>
    </View>
  );
}

// ─── Radial Rings ──────────────────────────────────────────────────
// Concentric rings that emanate from a point — great for hero/header
export function RadialRings({ color = '#fff', opacity = 0.04, cx = 300, cy = 60 }: {
  color?: string; opacity?: number; cx?: number; cy?: number;
}) {
  return (
    <View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        {[40, 80, 120, 160, 200, 240].map((r) => (
          <Circle key={r} cx={cx} cy={cy} r={r} stroke={color} strokeWidth={0.8} fill="none" />
        ))}
      </Svg>
    </View>
  );
}

// ─── Woven Mesh ────────────────────────────────────────────────────
// Interlocking arcs — feels handcrafted and warm
export function WovenMesh({ color = '#1B6B5F', opacity = 0.035 }: {
  color?: string; opacity?: number;
}) {
  return (
    <View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="woven" width={24} height={24} patternUnits="userSpaceOnUse">
            <Path d="M0,12 Q6,6 12,12 Q18,18 24,12" stroke={color} strokeWidth={0.8} fill="none" />
            <Path d="M12,0 Q6,6 12,12 Q18,18 12,24" stroke={color} strokeWidth={0.8} fill="none" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#woven)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
