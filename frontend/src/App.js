import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

function App() {
  const [admin, setAdmin] = useState(() => localStorage.getItem('admin'));
  const [password, setPassword] = useState('');
  const [risks, setRisks] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (admin) {
      fetch('http://localhost:5000/api/risk_scores')
        .then((res) => res.json())
        .then((data) => setRisks(data))
        .catch((err) => console.error('Failed to fetch:', err));
    }
  }, [admin]);

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
  };

  const filteredRisks = risks.filter((r) =>
    filter === 'all' ? true : r.status === filter
  );

  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-4">
        <div className="bg-white text-gray-900 p-8 rounded-xl shadow-xl w-full max-w-md space-y-4 animate-fadeIn">
          <h2 className="text-3xl font-bold text-center">🔐 Admin Login</h2>
          <p className="text-center text-gray-500">Please enter the admin password to access the risk dashboard</p>
          <input
            type="password"
            placeholder="Enter admin password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-white px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">🔐 Predictive Risk Scoring Dashboard</h1>
          <div className="flex gap-4 items-center">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-sm"
            >
              <option value="all">Filter: All</option>
              <option value="normal">Normal</option>
              <option value="suspicious">Suspicious</option>
            </select>
            <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white">
              Logout
            </button>
          </div>
        </div>

        {/* Risk List */}
        <div className="grid gap-4">
          {filteredRisks.map((user) => (
            <div key={user.id} className="bg-white text-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold">User ID: {user.id}</h3>
              <p className="mt-2">Score: <span className="font-semibold">{user.score}</span></p>
              <p>Status: <span className={user.status === 'suspicious' ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </span></p>
              {user.reasons && user.reasons.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Reasons:</p>
                  <ul className="list-disc list-inside">
                    {user.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="mt-8 bg-white rounded-lg p-6 text-gray-800 shadow-lg">
          <h2 className="text-xl font-bold mb-4">📊 Risk Score Chart</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredRisks}>
              <XAxis dataKey="id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
