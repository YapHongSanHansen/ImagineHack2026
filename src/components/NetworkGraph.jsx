import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { avatarUrl } from '../lib/avatar';

// Lazy: react-force-graph-2d is canvas-only and heavy; keep it out of the main bundle.
const ForceGraph2D = lazy(() => import('react-force-graph-2d'));

const CALLOUT_RING = { HUB: '#10E5A1', SILO: '#FFC857', SPOF: '#FF4D6D' };

export default function NetworkGraph({ graph, selectedId, onSelect, highlightIds = null }) {
  const wrapRef = useRef(null);
  const [size, setSize] = useState({ w: 800, h: 520 });

  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: Math.max(320, r.width), h: Math.max(360, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Stable, cloned graph data (force-graph mutates node/link objects).
  const data = useMemo(
    () => ({
      nodes: graph.nodes.map((n) => ({ ...n })),
      links: graph.links.map((l) => ({ ...l })),
    }),
    [graph]
  );

  // Preload a person photo per node; refresh the canvas once each loads.
  const fgRef = useRef(null);
  const imgCache = useRef(new Map());
  useEffect(() => {
    for (const n of data.nodes) {
      if (imgCache.current.has(n.id)) continue;
      const img = new Image();
      img.src = avatarUrl(n.id);
      img.onload = () => fgRef.current?.refresh?.();
      imgCache.current.set(n.id, img);
    }
  }, [data]);

  // adjacency from raw string ids for highlight logic
  const neighbors = useMemo(() => {
    const m = new Map();
    for (const l of graph.links) {
      if (!m.has(l.source)) m.set(l.source, new Set());
      if (!m.has(l.target)) m.set(l.target, new Set());
      m.get(l.source).add(l.target);
      m.get(l.target).add(l.source);
    }
    return m;
  }, [graph]);

  const hi = useMemo(() => (highlightIds && highlightIds.length ? new Set(highlightIds) : null), [highlightIds]);

  const endId = (e) => (typeof e === 'object' && e ? e.id : e);
  const isLit = useCallback(
    (id) => {
      if (hi) return hi.has(id);
      return !selectedId || id === selectedId || neighbors.get(selectedId)?.has(id);
    },
    [selectedId, neighbors, hi]
  );
  const inTeam = useCallback((id) => hi?.has(id) ?? false, [hi]);

  const paintNode = useCallback(
    (node, ctx, scale) => {
      const r = node.val || 5;
      const lit = isLit(node.id);
      const alpha = lit ? 1 : 0.18;
      ctx.save();
      ctx.globalAlpha = alpha;

      // glow for hero / selected / drafted-team nodes
      const team = inTeam(node.id);
      if (node.callout || node.id === selectedId || team) {
        ctx.shadowColor = team ? '#10E5A1' : CALLOUT_RING[node.callout] || node.color;
        ctx.shadowBlur = team ? 22 : 18;
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // person photo clipped into the bubble (the colored fill above is the fallback)
      const img = imgCache.current.get(node.id);
      if (img && img.complete && img.naturalWidth > 0) {
        const s = Math.min(img.naturalWidth, img.naturalHeight); // center-crop to square
        const sx = (img.naturalWidth - s) / 2;
        const sy = (img.naturalHeight - s) / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, sx, sy, s, s, node.x - r, node.y - r, 2 * r, 2 * r);
        ctx.restore();
      }

      // archetype-colored base ring keeps the role readable over the photo
      ctx.lineWidth = 1.5 / scale;
      ctx.strokeStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.stroke();

      // callout / selection / team ring
      const ring = team ? '#10E5A1' : CALLOUT_RING[node.callout] || (node.id === selectedId ? '#EAF2FF' : null);
      if (ring) {
        ctx.lineWidth = 2.5 / scale;
        ctx.strokeStyle = ring;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 2.5 / scale, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // labels for hero + selected + drafted team
      if ((node.callout || node.id === selectedId || team) && lit) {
        const fs = 11 / scale;
        ctx.font = `600 ${fs}px "Space Grotesk", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#EAF2FF';
        ctx.fillText(node.name, node.x, node.y + r + 3 / scale);
        if (node.callout) {
          ctx.fillStyle = CALLOUT_RING[node.callout];
          ctx.font = `700 ${9 / scale}px "Space Grotesk", sans-serif`;
          ctx.fillText(node.callout, node.x, node.y - r - 12 / scale);
        }
      }
      ctx.restore();
    },
    [isLit, selectedId, inTeam]
  );

  return (
    <div ref={wrapRef} className="h-full w-full">
      <Suspense fallback={<div className="grid h-full place-items-center text-text-dim">Loading network…</div>}>
        <ForceGraph2D
          ref={fgRef}
          width={size.w}
          height={size.h}
          graphData={data}
          backgroundColor="rgba(0,0,0,0)"
          cooldownTicks={120}
          d3VelocityDecay={0.3}
          nodeRelSize={1}
          nodeVal={(n) => n.val}
          nodeLabel={(n) => `${n.name} · ${n.department} · ${n.utilization}% util`}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, (node.val || 5) + 3, 0, 2 * Math.PI);
            ctx.fill();
          }}
          linkColor={(l) => {
            if (hi) {
              const both = hi.has(endId(l.source)) && hi.has(endId(l.target));
              return both ? 'rgba(16,229,161,0.9)' : 'rgba(147,164,200,0.05)';
            }
            const lit = isLit(endId(l.source)) && isLit(endId(l.target));
            return lit ? 'rgba(147,164,200,0.35)' : 'rgba(147,164,200,0.06)';
          }}
          linkWidth={(l) => {
            const both = hi && hi.has(endId(l.source)) && hi.has(endId(l.target));
            return (both ? 1.5 : 0.5) + l.weight * (both ? 3.5 : 2.5);
          }}
          onNodeClick={(n) => onSelect?.(n.id)}
          onBackgroundClick={() => onSelect?.(null)}
        />
      </Suspense>
    </div>
  );
}
