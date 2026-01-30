'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface CheatSheetBox {
  number: number;
  title: string;
  description: string;
  code_example: string;
  tip: string;
}

interface CheatSheetContentEditorProps {
  title: string;
  subtitle: string;
  boxes: CheatSheetBox[];
  sessionId: number;
}

export default function CheatSheetContentEditor({
  title,
  subtitle,
  boxes,
  sessionId
}: CheatSheetContentEditorProps) {
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedSubtitle, setEditedSubtitle] = useState(subtitle);
  const [editedBoxes, setEditedBoxes] = useState<CheatSheetBox[]>(boxes);

  const updateBox = (index: number, field: keyof CheatSheetBox, value: string) => {
    const newBoxes = [...editedBoxes];
    newBoxes[index] = { ...newBoxes[index], [field]: value };
    setEditedBoxes(newBoxes);
  };

  const exportContent = () => {
    const content = {
      session_id: sessionId,
      title: editedTitle,
      subtitle: editedSubtitle,
      boxes: editedBoxes,
    };
    console.log('📋 Updated Content:');
    console.log(JSON.stringify(content, null, 2));
    alert('Content exported to console! Press F12 to copy.');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-6">✏️ Content Editor</h2>

      {/* Header Section */}
      <div className="mb-6 p-4 bg-gray-800 rounded">
        <h3 className="text-white font-bold mb-3">Header</h3>
        <div className="space-y-3">
          <div>
            <label className="text-gray-300 text-sm">Title:</label>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded mt-1"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm">Subtitle:</label>
            <input
              type="text"
              value={editedSubtitle}
              onChange={(e) => setEditedSubtitle(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded mt-1"
            />
          </div>
        </div>
      </div>

      {/* Boxes */}
      <div className="space-y-4">
        {editedBoxes.map((box, index) => (
          <div key={box.number} className="p-4 bg-gray-800 rounded">
            <h3 className="text-yellow-400 font-bold mb-3">Box {box.number}</h3>

            <div className="space-y-3">
              <div>
                <label className="text-gray-300 text-sm">Title:</label>
                <input
                  type="text"
                  value={box.title}
                  onChange={(e) => updateBox(index, 'title', e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded mt-1"
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm">Description:</label>
                <textarea
                  value={box.description}
                  onChange={(e) => updateBox(index, 'description', e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded mt-1"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm">
                  Code Example (Use \n for line breaks):
                </label>
                <textarea
                  value={box.code_example}
                  onChange={(e) => updateBox(index, 'code_example', e.target.value)}
                  className="w-full p-2 bg-gray-700 text-green-400 rounded mt-1 font-mono"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-gray-300 text-sm">Tip:</label>
                <textarea
                  value={box.tip}
                  onChange={(e) => updateBox(index, 'tip', e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded mt-1"
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Button */}
      <div className="mt-6">
        <Button
          onClick={exportContent}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3"
        >
          Export Updated Content to Console
        </Button>
      </div>

      <div className="mt-4 p-4 bg-gray-800 rounded text-sm text-gray-300">
        <p className="font-bold mb-2">Instructions:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Edit the text content above</li>
          <li>For code examples, use \n to add line breaks</li>
          <li>Click "Export" when done</li>
          <li>Copy the JSON from console (F12)</li>
          <li>Update the database with the new content</li>
        </ul>
      </div>
    </div>
  );
}
