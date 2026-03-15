import { useEffect, useState } from 'react';
import { api } from '../api/client';

type UserRow = { id: string; email: string; fullName: string; department?: string; role: { name: string }; isActive: boolean };

export default function Users() {
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<UserRow[]>('/users').then((r) => setList(r.data)).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="header">
        <h1 style={{ margin: 0 }}>Users</h1>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.department ?? '-'}</td>
                <td>{u.role?.name ?? '-'}</td>
                <td>{u.isActive ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
