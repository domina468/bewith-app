import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Switch } from './ui/switch';
import { X, Users, Lock, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface CreateRoomProps {
  onClose: () => void;
  onCreate: (roomData: RoomData) => void;
}

export interface RoomData {
  name: string;
  description: string;
  category: string;
  isPrivate: boolean;
  maxUsers: number;
  allowMusic: boolean;
}

const categories = [
  { value: 'study', label: 'Study', emoji: '📚' },
  { value: 'work', label: 'Work', emoji: '💼' },
  { value: 'cleaning', label: 'Cleaning', emoji: '🧹' },
  { value: 'morning', label: 'Morning Routine', emoji: '🌅' },
  { value: 'relax', label: 'Relax & Chill', emoji: '😌' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'cooking', label: 'Cooking', emoji: '🍳' },
  { value: 'other', label: 'Other', emoji: '✨' }
];

export function CreateRoom({ onClose, onCreate }: CreateRoomProps) {
  const [formData, setFormData] = useState<RoomData>({
    name: '',
    description: '',
    category: 'study',
    isPrivate: false,
    maxUsers: 30,
    allowMusic: true
  });

  const handleSubmit = () => {
    if (formData.name.trim()) {
      onCreate(formData);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl text-gray-900">Create New Room</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Room Name */}
          <div>
            <Label htmlFor="room-name">Room Name *</Label>
            <Input
              id="room-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Late Night Study Session"
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell others what this room is about..."
              className="mt-2 min-h-[80px]"
            />
          </div>

          {/* Category */}
          <div>
            <Label>Category *</Label>
            <RadioGroup
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              className="grid grid-cols-2 gap-3 mt-2"
            >
              {categories.map((cat) => (
                <div key={cat.value} className="relative">
                  <RadioGroupItem
                    value={cat.value}
                    id={cat.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={cat.value}
                    className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#81C784] peer-data-[state=checked]:border-[#81C784] peer-data-[state=checked]:bg-[#E8F5E9] transition-all"
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-sm text-gray-900">{cat.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Privacy */}
          <div>
            <Label>Privacy</Label>
            <div className="mt-2 space-y-3">
              <div
                onClick={() => setFormData({ ...formData, isPrivate: false })}
                className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  !formData.isPrivate
                    ? 'border-[#81C784] bg-[#E8F5E9]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  !formData.isPrivate ? 'bg-[#81C784]' : 'bg-gray-200'
                }`}>
                  <Globe className={`w-5 h-5 ${!formData.isPrivate ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 mb-1">Public</p>
                  <p className="text-sm text-gray-600">Anyone can discover and join this room</p>
                </div>
              </div>

              <div
                onClick={() => setFormData({ ...formData, isPrivate: true })}
                className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.isPrivate
                    ? 'border-[#81C784] bg-[#E8F5E9]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  formData.isPrivate ? 'bg-[#81C784]' : 'bg-gray-200'
                }`}>
                  <Lock className={`w-5 h-5 ${formData.isPrivate ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 mb-1">Private</p>
                  <p className="text-sm text-gray-600">Only people with the invite link can join</p>
                </div>
              </div>
            </div>
          </div>

          {/* Max Users */}
          <div>
            <Label htmlFor="max-users">Maximum Participants</Label>
            <div className="mt-2 flex items-center gap-4">
              <Users className="w-5 h-5 text-gray-500" />
              <input
                type="range"
                id="max-users"
                min="5"
                max="100"
                step="5"
                value={formData.maxUsers}
                onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-gray-900 min-w-[3rem] text-right">{formData.maxUsers}</span>
            </div>
          </div>

          {/* Features */}
          <div>
            <Label>Features</Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-gray-900 mb-1">Shared Music</p>
                  <p className="text-sm text-gray-600">Allow participants to play music together</p>
                </div>
                <Switch
                  checked={formData.allowMusic}
                  onCheckedChange={(checked) => setFormData({ ...formData, allowMusic: checked })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim()}
            className="flex-1 bg-[#81C784] hover:bg-[#66BB6A] text-white"
          >
            Create Room
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
