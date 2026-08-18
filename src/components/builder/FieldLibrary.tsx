import React, { useState } from 'react';
import {
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDown,
  ListChecks,
  CircleDot,
  CheckSquare,
  Calendar,
  Clock,
  Upload,
  EyeOff,
  Heading,
  FileText,
  Minus,
  Image,
  Code,
  Send,
  Search,
  Plus,
} from 'lucide-react';
import { FieldType, FieldCategory } from '../../types';
import { FIELD_LIBRARY_ITEMS, FieldCatalogItem } from '../../utils/formBuilderUtils';

interface FieldLibraryProps {
  onAddField: (type: FieldType) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDown,
  ListChecks,
  CircleDot,
  CheckSquare,
  Calendar,
  Clock,
  Upload,
  EyeOff,
  Heading,
  FileText,
  Minus,
  Image,
  Code,
  Send,
};

export const FieldLibrary: React.FC<FieldLibraryProps> = ({ onAddField }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = FIELD_LIBRARY_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const basicItems = filteredItems.filter((i) => i.category === 'basic');
  const contentItems = filteredItems.filter((i) => i.category === 'content');
  const actionItems = filteredItems.filter((i) => i.category === 'action');

  const handleDragStart = (e: React.DragEvent, type: FieldType) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ source: 'library', type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderSection = (title: string, items: FieldCatalogItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
          {title}
        </h4>
        <div className="grid grid-cols-1 gap-1.5">
          {items.map((item) => {
            const IconComponent = ICON_MAP[item.iconName] || FileText;

            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => handleDragStart(e, item.type)}
                onClick={() => onAddField(item.type)}
                className="p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:shadow-2xs transition-all cursor-grab active:cursor-grabbing flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-slate-100 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 transition-colors">
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 leading-none">{item.label}</h5>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{item.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-100 rounded transition-all"
                  title="Click to add field"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-72 bg-slate-50/80 border-r border-slate-200 flex flex-col shrink-0 overflow-hidden">
      {/* Library Header & Search */}
      <div className="p-3 border-b border-slate-200 bg-white space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Field Library
          </h3>
          <span className="text-[10px] font-medium text-slate-400">Drag or click to add</span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search field types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Field Items Scroll Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {renderSection('Basic Fields', basicItems)}
        {renderSection('Content & Typography', contentItems)}
        {renderSection('Actions & Buttons', actionItems)}

        {filteredItems.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-400 space-y-1">
            <p>No matching fields found.</p>
          </div>
        )}
      </div>
    </aside>
  );
};
