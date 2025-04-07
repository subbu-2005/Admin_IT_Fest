'use client';

import { useEffect, useState } from 'react';

type Participant = {
  name: string;
  class: string;
  contact: string;
};

type Registration = {
  _id: string;
  team: string;
  event: string;
  participants: Participant[];
};

const eventDetails: { [event: string]: number } = {
  "Treasure Hunt": 4,
  "IT Brand Rangoli": 2,
  "Quiz": 2,
  "Coding": 2,
  "Photo Edits": 1,
  "Video Edits": 1,
  "Soft Interview": 1,
  "Gaming Girls (Militia)": 2,
  "Free Fire": 2,
  "BGMI": 2,
  "PPT Presentation": 1,
};

export default function AdminPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [editingReg, setEditingReg] = useState<Registration | null>(null);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const res = await fetch('/api/registrations');
        const data = await res.json();
        setRegistrations(data?.data || []);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  const filteredRegistrations = selectedEvent
    ? registrations.filter((reg) => reg.event === selectedEvent)
    : registrations;

  const handleEditChange = (index: number, field: keyof Participant, value: string) => {
    if (!editingReg) return;
    const updated = [...editingReg.participants];
    updated[index] = { ...updated[index], [field]: value };
    setEditingReg({ ...editingReg, participants: updated });
  };

  // ✅ Updated saveEdit function
  const saveEdit = async () => {
    if (!editingReg) return;

    const res = await fetch('/api/registrations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingReg._id,
        participants: editingReg.participants
      }),
    });

    if (res.ok) {
      setRegistrations((prev) =>
        prev.map((r) => (r._id === editingReg._id ? { ...r, participants: editingReg.participants } : r))
      );
      setEditingReg(null);
    } else {
      alert('Failed to update');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-200 p-4 border-r border-gray-400">
        <h2 className="text-xl font-bold text-red-600 mb-4">Events</h2>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => setSelectedEvent(null)}
              className={`w-full text-left px-4 py-2 rounded ${
                selectedEvent === null ? 'bg-red-500 text-white' : 'hover:bg-gray-300'
              }`}
            >
              All Events
            </button>
          </li>
          {Object.keys(eventDetails).map((eventName) => (
            <li key={eventName}>
              <button
                onClick={() => setSelectedEvent(eventName)}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedEvent === eventName ? 'bg-red-500 text-white' : 'hover:bg-gray-300'
                }`}
              >
                {eventName}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-x-auto">
        <h1 className="text-3xl font-bold text-gray-700 mb-6 text-center">IT Fest Admin Panel</h1>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-sm text-left border border-gray-300 rounded-md overflow-hidden bg-white">
            <thead className="bg-gray-200 text-black">
              <tr>
                <th className="p-2">Team</th>
                <th className="p-2">Event</th>
                <th className="p-2">Participants</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
                <tr key={reg._id} className="border-t border-gray-200">
                  <td className="p-2">{reg.team}</td>
                  <td className="p-2">{reg.event}</td>
                  <td className="p-2 whitespace-pre-line">
                    {reg.participants.map((p, i) => (
                      <div key={i}>
                        {p.name} ({p.class}) - {p.contact}
                      </div>
                    ))}
                  </td>
                  <td className="p-2 space-x-2">
                    <button
                      className="bg-yellow-500 px-3 py-1 rounded text-white hover:bg-yellow-600"
                      onClick={() => setEditingReg(reg)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600"
                      onClick={async () => {
                        const confirmDelete = confirm('Are you sure you want to delete this team?');
                        if (!confirmDelete) return;

                        const res = await fetch('/api/registrations', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: reg._id }),
                        });

                        if (res.ok) {
                          setRegistrations((prev) => prev.filter((r) => r._id !== reg._id));
                        } else {
                          alert('Failed to delete');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-500 py-4">
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Edit Modal */}
        {editingReg && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded w-[90%] max-w-lg">
              <h2 className="text-xl font-semibold mb-4">Edit Team: {editingReg.team}</h2>
              {editingReg.participants.map((p, i) => (
                <div key={i} className="mb-2 space-y-1">
                  <input
                    type="text"
                    placeholder="Name"
                    value={p.name}
                    className="w-full border p-2 rounded"
                    onChange={(e) => handleEditChange(i, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Class"
                    value={p.class}
                    className="w-full border p-2 rounded"
                    onChange={(e) => handleEditChange(i, 'class', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Contact"
                    value={p.contact}
                    className="w-full border p-2 rounded"
                    onChange={(e) => handleEditChange(i, 'contact', e.target.value)}
                  />
                </div>
              ))}
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  className="bg-gray-400 px-4 py-2 rounded text-white"
                  onClick={() => setEditingReg(null)}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-600 px-4 py-2 rounded text-white"
                  onClick={saveEdit}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
