import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, Legend
} from 'recharts';

function App() {
  const [admin, setAdmin] = useState(() => localStorage.getItem('admin'));
  const [password, setPassword] = useState('');
  const [risks, setRisks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState('id');
  const [model, setModel] = useState('iforest');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // ✅ useCallback to avoid unnecessary re-renders
  const fetchRisks = useCallback(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/risk_scores?model=${model}`)
      .then(res => res.json())
      .then(data => {
        setRisks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch:', err);
        setLoading(false);
      });
  }, [model]);

  useEffect(() => {
    if (admin) fetchRisks();
  }, [admin, fetchRisks]);

  const handleLogin = () => {
    if (password === 'admin123') {
      localStorage.setItem('admin', 'true');
      setAdmin(true);
    } else {
      alert('❌ Wrong password!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin');
    setAdmin(false);
    setPassword('');
    setSelectedUser(null);
  };

  const filteredRisks = risks
    .filter(r => filter === 'all' ? true : r.status === filter)
    .sort((a, b) => sortKey === 'score' ? b.score - a.score : a.id.localeCompare(b.id));

  const generateMockTrend = (score) => {
    return Array.from({ length: 10 }, (_, i) => ({
      time: `T${i + 1}`,
      score: Math.max(5, Math.round(score + Math.sin(i) * 5 + Math.random() * 3 - 1.5))
    }));
  };

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-4">
        <div className="bg-white text-gray-900 p-8 rounded-xl shadow-xl w-full max-w-md space-y-4 animate-fadeIn">
          <h2 className="text-3xl font-bold text-center">🔐 Admin Login</h2>
          <input
            type="password"
            placeholder="Enter admin password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg">
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500 mx-auto"></div>
          <p className="text-lg font-semibold mt-4">Loading risk data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-white px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold">🔐 Predictive Risk Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white text-black px-3 py-1 rounded-lg">
              <option value="all">All</option>
              <option value="normal">Normal</option>
              <option value="risk">Risk</option>
              <option value="high risk">High Risk</option>
              <option value="suspicious">Suspicious</option>
            </select>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className="bg-white text-black px-3 py-1 rounded-lg">
              <option value="id">Sort by ID</option>
              <option value="score">Sort by Score</option>
            </select>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="bg-white text-black px-3 py-1 rounded-lg">
              <option value="iforest">Isolation Forest</option>
              <option value="random">Random</option>
            </select>
            <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded-lg text-white">Logout</button>
          </div>
        </div>

        {/* Risk Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRisks.map(user => (
            <div key={user.id} className="bg-white text-gray-900 rounded-lg p-4 shadow hover:ring hover:ring-indigo-500" onClick={() => setSelectedUser(user)}>
              <h3 className="text-lg font-bold">User: {user.id}</h3>
              <p className="mt-1">Score: <span className="font-semibold">{user.score}</span></p>
              <p>Status:
                <span className={
                  user.status === 'suspicious' ? 'text-purple-700 font-bold' :
                    user.status === 'high risk' ? 'text-red-600 font-bold' :
                      user.status === 'risk' ? 'text-yellow-500 font-bold' :
                        'text-green-600 font-bold'
                }>
                  {user.status}
                </span>
              </p>
              {user.reasons?.length > 0 && (
                <ul className="list-disc list-inside text-sm mt-1">
                  {user.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Bar Chart of All Users */}
        <div className="mt-10 bg-white text-gray-900 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-2">📊 Risk Scores of All Users</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredRisks}>
              <XAxis dataKey="id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score">
                {filteredRisks.map((entry, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={
                      entry.status === 'suspicious' ? '#7e22ce' :
                        entry.status === 'high risk' ? '#dc2626' :
                          entry.status === 'risk' ? '#f59e0b' :
                            '#16a34a'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart for Selected User */}
        {selectedUser && (
          <div className="mt-10 bg-white text-black p-6 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">📈 Score Trend - {selectedUser.id}</h2>
              <button onClick={() => setSelectedUser(null)} className="text-red-600 hover:underline">Close</button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={generateMockTrend(selectedUser.score)}>
                <XAxis dataKey="time" stroke="#555" />
                <YAxis stroke="#555" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={
                    selectedUser.status === 'suspicious' ? '#7e22ce' :
                      selectedUser.status === 'high risk' ? '#dc2626' :
                        selectedUser.status === 'risk' ? '#f59e0b' :
                          '#16a34a'
                  }
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
