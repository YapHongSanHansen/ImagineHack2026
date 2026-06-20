import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Lazy: react-force-graph-2d is canvas-only and heavy; keep it out of the main bundle.
const ForceGraph2D = lazy(() => import('react-force-graph-2d'));

const CALLOUT_RING = { HUB: '#2DE2E6', SILO: '#FFC857', SPOF: '#FF4D6D' };

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
        ctx.shadowColor = team ? '#2DE2E6' : CALLOUT_RING[node.callout] || node.color;
        ctx.shadowBlur = team ? 22 : 18;
      }
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // callout / selection / team ring
      const ring = team ? '#2DE2E6' : CALLOUT_RING[node.callout] || (node.id === selectedId ? '#EAF2FF' : null);
      if (ring) {
        ctx.lineWidth = 2 / scale;
        ctx.strokeStyle = ring;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 3 / scale, 0, 2 * Math.PI);
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
              return both ? 'rgba(45,226,230,0.9)' : 'rgba(147,164,200,0.05)';
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
