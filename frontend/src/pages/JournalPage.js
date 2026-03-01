import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Journal.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MOOD_ICONS = { great: '😄', good: '🙂', okay: '😐', low: '😔', terrible: '😢' };

export default function JournalPage() {
  const { isIncognito } = useAuth();
  const [journals, setJournals] = useState([]);
  const [todayJournal, setTodayJournal] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [manualText, setManualText] = useState('');
  const [manualMood, setManualMood] = useState('okay');
  const [savingManual, setSavingManual] = useState(false);
  const [message, setMessage] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!isIncognito) {
      fetchJournals();
    }
  }, [isIncognito]);

  const fetchJournals = async () => {
    try {
      const res = await axios.get(`${API}/journal`);
      setJournals(res.data);
      const todayEntry = res.data.find(j => j.date === today);
      if (todayEntry) setTodayJournal(todayEntry);
    } catch { }
  };

  const generateJournal = async () => {
    setGenerating(true);
    setMessage('');
    try {
      const res = await axios.post(`${API}/journal/generate`);
      setTodayJournal(res.data);
      setMessage("Today's journal generated from your conversations! ✨");
      fetchJournals();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not generate journal. Have a chat first!');
    } finally {
      setGenerating(false);
    }
  };

  const saveManual = async () => {
    if (!manualText.trim()) return;
    setSavingManual(true);
    try {
      const res = await axios.post(`${API}/journal/manual`, { content: manualText, mood: manualMood });
      setTodayJournal(res.data);
      setManualText('');
      setMessage('Journal entry saved! 📓');
      fetchJournals();
    } catch {
      setMessage('Could not save journal.');
    } finally {
      setSavingManual(false);
    }
  };

  if (isIncognito) {
    return (
      <div className="journal-page incognito">
        <div className="journal-header">
          <div>
            <h1>📓 Journal</h1>
            <p>Your daily reflections</p>
          </div>
        </div>
        <div className="journal-empty">
          <p>🕵️ Journal is not available in Incognito Mode.</p>
          <p>Turn off Incognito to access your journal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="journal-page">
      <div className="journal-header">
        <div>
          <h1>📓 My Journal</h1>
          <p>Your AI-powered daily wellness diary</p>
        </div>
        <button className="generate-btn" onClick={generateJournal} disabled={generating}>
          {generating ? '✨ Generating...' : '✨ Generate from Today\'s Chats'}
        </button>
      </div>

      {message && (
        <div className="journal-message">
          {message}
        </div>
      )}

      {/* Today's Journal */}
      <div className="journal-today">
        <h2>Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
        {todayJournal ? (
          <>
            <span className={`mood-badge mood-${todayJournal.mood}`}>
              {MOOD_ICONS[todayJournal.mood]} {todayJournal.mood.charAt(0).toUpperCase() + todayJournal.mood.slice(1)}
            </span>
            <p className="journal-content">{todayJournal.content}</p>
          </>
        ) : (
          <div className="journal-empty">
            <p>No journal entry yet for today.</p>
            <p>Chat with ManoRakshak and then generate your journal, or write one manually below.</p>
          </div>
        )}
      </div>

      {/* Manual Journal */}
      <div className="manual-journal">
        <h3>✍️ Write manually</h3>
        <textarea
          value={manualText}
          onChange={e => setManualText(e.target.value)}
          placeholder="How are you feeling today? Write freely..."
        />
        <div>
          <select value={manualMood} onChange={e => setManualMood(e.target.value)}>
            <option value="great">😄 Great</option>
            <option value="good">🙂 Good</option>
            <option value="okay">😐 Okay</option>
            <option value="low">😔 Low</option>
            <option value="terrible">😢 Terrible</option>
          </select>
          <button className="save-manual-btn" onClick={saveManual} disabled={savingManual}>
            {savingManual ? 'Saving...' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* Past Journals */}
      {journals.filter(j => j.date !== today).length > 0 && (
        <div className="past-journals">
          <h2>Past Entries</h2>
          <div className="journal-list">
            {journals.filter(j => j.date !== today).map(journal => (
              <div key={journal._id} className="journal-entry" onClick={() => setSelectedJournal(journal)}>
                <div className="journal-entry-header">
                  <span className="journal-date">
                    {new Date(journal.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className={`mood-badge mood-${journal.mood}`}>
                    {MOOD_ICONS[journal.mood]} {journal.mood}
                  </span>
                </div>
                <p className="journal-preview">{journal.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedJournal && (
        <div className="journal-modal-overlay" onClick={() => setSelectedJournal(null)}>
          <div className="journal-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedJournal(null)}>✕</button>
            <h2>
              {new Date(selectedJournal.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <span className={`mood-badge mood-${selectedJournal.mood}`}>
              {MOOD_ICONS[selectedJournal.mood]} {selectedJournal.mood}
            </span>
            <p className="modal-content">{selectedJournal.content}</p>
          </div>
        </div>
      )}
    </div>
  );
}
