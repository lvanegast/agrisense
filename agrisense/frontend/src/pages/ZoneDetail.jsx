import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Thermometer, Droplets, Sun, FlaskConical } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';

const iconMap = { temperature: Thermometer, humidity: Droplets, soil_moisture: Droplets, ph: FlaskConical, light: Sun };

const sensorColors = {
  temperature: '#f59e0b',
  humidity: '#60a5fa',
  soil_moisture: '#4ade80',
  ph: '#c084fc',
  light: '#fbbf24',
};

export default function ZoneDetail() {
  const { zoneId } = useParams();
  const [stats, setStats] = useState(null);
  const [sensorData, setSensorData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const s = await api.getZoneStats(zoneId);
      setStats(s);

      const allReadings = {};
      if (s.sensors) {
        await Promise.all(
          s.sensors.map(async (sensor) => {
            const readings = await api.getReadings(sensor.id, new Date(Date.now() - 600000).toISOString());
            allReadings[sensor.id] = readings.map((r) => ({
              time: new Date(r.timestamp).toLocaleTimeString(),
              value: r.value,
            }));
          })
        );
      }
      setSensorData(allReadings);
      setLoading(false);
    };
    loadStats();
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [zoneId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="text-forest-300 font-syne text-lg">Cargando zona...</span>
    </div>
  );

  if (!stats) return null;

  const activeSensors = stats.sensors?.filter((s) => s.is_active) || [];

  return (
    <div>
      <Link to="/" className="flex items-center gap-2 text-forest-300 hover:text-white transition-colors mb-6 text-sm font-dm">
        <ArrowLeft size={16} /> Volver al Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-syne font-bold text-3xl text-white">{stats.name}</h2>
          <p className="text-forest-300 text-sm mt-1 font-dm">
            {stats.crop_type} · {stats.location} · {stats.area} ha
          </p>
        </div>
      </div>

      {/* Sensor status grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {activeSensors.map((sensor) => {
          const Icon = iconMap[sensor.type] || Thermometer;
          return (
            <div key={sensor.id} className="bg-forest-900 border border-forest-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon size={16} className="text-sprout-400" />
                <span className="text-xs text-forest-300 font-mono uppercase">{sensor.type}</span>
              </div>
              <div className="font-mono font-bold text-2xl text-white">
                {sensor.latest_value !== null ? sensor.latest_value.toFixed(1) : '--'}
              </div>
              <div className="text-xs text-forest-400 mt-0.5">{sensor.unit}</div>
              <div className="text-[10px] text-forest-300 mt-2 font-dm truncate">{sensor.name}</div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeSensors.map((sensor) => {
          const data = sensorData[sensor.id] || [];
          const color = sensorColors[sensor.type] || '#4ade80';
          return (
            <div key={sensor.id} className="bg-forest-900 border border-forest-700 rounded-xl p-5">
              <h4 className="font-syne font-semibold text-sm text-white mb-4">{sensor.name}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1b341b" />
                  <XAxis dataKey="time" stroke="#5a7e5a" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis stroke="#5a7e5a" tick={{ fontSize: 10 }} width={45} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0d170d',
                      border: '1px solid #1b341b',
                      borderRadius: '8px',
                      color: '#e0e8e0',
                      fontSize: '12px',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
