import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Generic radar. Recharts MUST live inside a fixed-height parent (React-18 + the
// ResponsiveContainer height:100% pattern) or it renders blank.
export default function RadarComp({ data, angleKey, series, height = 260, domain }) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#1F2A40" />
          <PolarAngleAxis dataKey={angleKey} tick={{ fill: '#93A4C8', fontSize: 11 }} />
          <PolarRadiusAxis domain={domain} tick={false} axisLine={false} />
          {series.map((s) => (
            <Radar
              key={s.key}
              name={s.name}
              dataKey={s.key}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.fillOpacity ?? 0.25}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              isAnimationActive
            />
          ))}
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#93A4C8' }} />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
