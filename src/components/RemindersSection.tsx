'use client';

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { FaTrash, FaPlus, FaEdit } from 'react-icons/fa';

const RemindersSection = () => {
  const { reminderNotes, addReminderNote, toggleReminderNote, deleteReminderNote, updateReminderNote } = useData();
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedNoteText, setEditedNoteText] = useState('');

  const handleEditClick = (noteId: string, currentText: string) => {
    setEditingNoteId(noteId);
    setEditedNoteText(currentText);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedNoteText(e.target.value);
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editedNoteText.trim()) {
      updateReminderNote(editingNoteId, editedNoteText.trim());
      setEditingNoteId(null);
      setEditedNoteText('');
    } else if (editingNoteId) {
      // If text is empty, delete the note
      deleteReminderNote(editingNoteId);
      setEditingNoteId(null);
      setEditedNoteText('');
    }
  };

  const handleEditBlur = () => {
    handleSaveEdit();
  };

  const handleEditKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
  };

  const handleAddNote = () => {
    if (newNoteText.trim()) {
      addReminderNote(newNoteText);
      setNewNoteText('');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Lembretes</h2>
      
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Adicionar novo lembrete..."
          className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-gold-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
          value={newNoteText}
          onChange={(e) => setNewNoteText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddNote();
            }
          }}
        />
        <button
          onClick={handleAddNote}
          className="bg-gold-500 text-white p-2 rounded-r-md hover:bg-gold-600 transition-colors flex items-center justify-center dark:bg-gold-600 dark:hover:bg-gold-700"
        >
          <FaPlus className="text-lg" />
        </button>
      </div>

      {reminderNotes.length > 0 ? (
        <ul className="space-y-2 flex-grow overflow-y-auto pr-2 max-h-80">
          {reminderNotes.map((note) => (
            <li key={note.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md shadow-sm">
              <div className="flex items-center flex-grow">
                <input
                  type="checkbox"
                  checked={note.completed}
                  onChange={() => toggleReminderNote(note.id)}
                  className="h-5 w-5 text-gold-600 focus:ring-gold-500 border-gray-300 rounded dark:bg-gray-600 dark:border-gray-500"
                />
                {editingNoteId === note.id ? (
                  <input
                    type="text"
                    value={editedNoteText}
                    onChange={handleEditChange}
                    onBlur={handleEditBlur}
                    onKeyPress={handleEditKeyPress}
                    className="ml-3 flex-grow p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gold-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    autoFocus
                  />
                ) : (
                  <span
                    className={`ml-3 text-gray-800 dark:text-gray-200 flex-grow ${note.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}
                    onDoubleClick={() => handleEditClick(note.id, note.text)} // Double click to edit
                  >
                    {note.text}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {editingNoteId !== note.id && (
                  <button
                    onClick={() => handleEditClick(note.id, note.text)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <FaEdit />
                  </button>
                )}
                <button
                  onClick={() => deleteReminderNote(note.id)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">Nenhum lembrete adicionado ainda.</p>
      )}
    </div>
  );
};

export default RemindersSection;