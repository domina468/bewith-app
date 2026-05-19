import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { X, Bell, Video, Moon, Globe, Shield, CircleHelp, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsModalProps {
  onClose: () => void;
  onSignOut?: () => void;
}

export function SettingsModal({ onClose, onSignOut }: SettingsModalProps) {
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
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-xl text-gray-900">Settings</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Notifications */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg text-gray-900">Notifications</h3>
            </div>
            <div className="space-y-4 ml-13">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900">Gentle Updates</p>
                  <p className="text-sm text-gray-600">Get notified when friends join rooms</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900">Room Activity</p>
                  <p className="text-sm text-gray-600">Notifications when favorite rooms are active</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900">Achievement Celebrations</p>
                  <p className="text-sm text-gray-600">Get notified about new badges (no pressure)</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          <Separator />

          {/* Video & Audio */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg text-gray-900">Video & Audio</h3>
            </div>
            <div className="space-y-4 ml-13">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900">Auto-join with Video</p>
                  <p className="text-sm text-gray-600">Turn on camera automatically when joining</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900">HD Video Quality</p>
                  <p className="text-sm text-gray-600">Use higher quality video (more data)</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900">Background Blur</p>
                  <p className="text-sm text-gray-600">Automatically blur your background</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          <Separator />

          {/* Appearance */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Moon className="w-5 h-5 text-gray-600" />
              </div>
              <h3 className="text-lg text-gray-900">Appearance</h3>
            </div>
            <div className="space-y-4 ml-13">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-900">Dark Mode</p>
                  <p className="text-sm text-gray-600">Use dark theme across the app</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          <Separator />

          {/* Language */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg text-gray-900">Language</h3>
            </div>
            <div className="ml-13">
              <p className="text-gray-900">English (US)</p>
              <p className="text-sm text-gray-600 mt-1">More languages coming soon</p>
            </div>
          </div>

          <Separator />

          {/* Privacy & Safety */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg text-gray-900">Privacy & Safety</h3>
            </div>
            <div className="ml-13 bg-gradient-to-r from-[#E8F5E9] to-[#E3F2FD] rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                🔒 Your privacy matters
              </p>
              <p className="text-xs text-gray-600">
                BeWith never records sessions or allows screenshots. Your shared moments stay private.
              </p>
            </div>
            <div className="space-y-3 ml-13">
              <Button variant="ghost" className="w-full justify-start text-gray-700">
                Blocked Users
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700">
                Privacy Policy
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700">
                Terms of Service
              </Button>
            </div>
          </div>

          <Separator />

          {/* Support */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <CircleHelp className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg text-gray-900">Support</h3>
            </div>
            <div className="space-y-3 ml-13">
              <Button variant="ghost" className="w-full justify-start text-gray-700">
                Help Center
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700">
                Report a Problem
              </Button>
              <Button variant="ghost" className="w-full justify-start text-gray-700">
                About BeWith
              </Button>
            </div>
          </div>

          <Separator />

          {/* Account Actions */}
          <div className="pt-2">
            <Button
              onClick={onSignOut}
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}