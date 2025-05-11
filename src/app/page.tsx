'use client';

import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  "Ready Player One": 4,
  "Rangitaranaga": 2,
  "The Matrix": 2,
  "KGF(KODE GEEK FORCE)": 2,
  "Shutter island": 1,
  "Blade Runner 2049": 1,
  "Invictus": 1,
  "Furiosa": 2,
  "Fight Club": 2,
  "Death Race": 2,
  "Inception": 1,
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

  const downloadPDF = () => {
    const doc = new jsPDF();
    const title = selectedEvent || 'All Events';
  
    doc.setFontSize(16);
    doc.text(`Registrations for: ${title}`, 14, 15);
  
    // Group registrations by team
    const groupedByTeam = {};
    filteredRegistrations.forEach((reg) => {
      if (!groupedByTeam[reg.team]) {
        groupedByTeam[reg.team] = [];
      }
      groupedByTeam[reg.team].push(reg);
    });
  
    const body = [];
  
    // Build body with styled team headers + participants
    Object.entries(groupedByTeam).forEach(([teamName, registrations]) => {
      // Add a team header row (bold, full-width, centered)
      body.push([
        {
          content: `Team: ${teamName}`,
          colSpan: 6,
          styles: {
            halign: 'center',
            fontStyle: 'bold',
            fillColor: [41, 128, 185], // nice blue
            textColor: 255,
          },
        },
      ]);
  
      registrations.forEach((reg) => {
        reg.participants.forEach((p, idx) => {
          body.push([
            reg.team,
            reg.event,
            idx + 1,
            p.name,
            p.class,
            p.contact,
          ]);
        });
      });
  
      // Add an empty spacer row between teams (optional but clean)
      body.push([
        {
          content: '',
          colSpan: 6,
          styles: { fillColor: [255, 255, 255] },
        },
      ]);
    });
  
    autoTable(doc, {
      head: [['Team', 'Event', 'S.No', 'Name', 'Class', 'Contact']],
      body: body,
      startY: 25,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [22, 160, 133], // teal header
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // light gray stripe
      },
      margin: { top: 20 },
      theme: 'striped',
    });
  
    doc.save(`${title.replace(/\s/g, '_')}_Registrations.pdf`);
  };
  

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col md:flex-row">
      {/* Sidebar */}
      {!selectedEvent && (
        <div className="w-full md:w-64 bg-gray-800 text-white p-4 border-r border-gray-700">
          <h2 className="text-xl font-bold mb-4">Events</h2>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setSelectedEvent(null)}
                className={`w-full text-left px-4 py-2 rounded ${
                  selectedEvent === null ? 'bg-gray-700' : 'hover:bg-gray-600'
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
                    selectedEvent === eventName ? 'bg-gray-700' : 'hover:bg-gray-600'
                  }`}
                >
                  {eventName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 overflow-x-auto">
        <h1 className="text-3xl font-bold text-center mb-6">IT Fest Admin Panel</h1>

        {selectedEvent && (
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedEvent(null)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Back to All Events
            </button>
            <button
              onClick={downloadPDF}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              Download PDF
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <table className="w-full text-sm text-left border border-gray-700 rounded-md overflow-hidden bg-gray-900">
            <thead className="bg-gray-700 text-gray-200">
              <tr>
                <th className="p-2">Team</th>
                <th className="p-2">Event</th>
                <th className="p-2">Participants</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
                <tr key={reg._id} className="border-t border-gray-800">
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
            <div className="bg-gray-800 p-6 rounded w-[90%] max-w-lg">
              <h2 className="text-xl font-semibold mb-4 text-white">Edit Team: {editingReg.team}</h2>
              {editingReg.participants.map((p, i) => (
                <div key={i} className="mb-2 space-y-1">
                  <input
                    type="text"
                    placeholder="Name"
                    value={p.name}
                    className="w-full border p-2 rounded bg-gray-700 text-white"
                    onChange={(e) => handleEditChange(i, 'name', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Class"
                    value={p.class}
                    className="w-full border p-2 rounded bg-gray-700 text-white"
                    onChange={(e) => handleEditChange(i, 'class', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Contact"
                    value={p.contact}
                    className="w-full border p-2 rounded bg-gray-700 text-white"
                    onChange={(e) => handleEditChange(i, 'contact', e.target.value)}
                  />
                </div>
              ))}
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  className="bg-gray-500 px-4 py-2 rounded text-white"
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