import React, { useState } from 'react';
import {
  Clock,
  GitCommit,
  Eye,
  RotateLeft,
  FileText,
  User,
  CheckCircle,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Diff,
  AlertTriangle
} from 'lucide-react';

/**
 * VersionTimeline Component
 * 
 * Displays version history with:
 * - Vertical timeline layout
 * - Current version highlight
 * - Diff viewer (before/after)
 * - Revert functionality
 * - Version notes
 */

const VersionTimeline = ({
  versions = [],
  currentVersionId,
  onViewDiff,
  onRevert,
  onAddNote,
  currentUser,
  canRevert = true
}) => {
  const [expandedVersion, setExpandedVersion] = useState(currentVersionId);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState(null);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [versionToRevert, setVersionToRevert] = useState(null);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const getVersionLabel = (version, index, total) => {
    if (version.id === currentVersionId) return 'Current';
    if (index === 0) return 'Latest';
    return `v${total - index}`;
  };

  const handleViewDiff = (version) => {
    const prevVersion = versions[versions.indexOf(version) + 1];
    if (prevVersion) {
      setSelectedDiff({
        current: version,
        previous: prevVersion
      });
      setShowDiffModal(true);
    }
  };

  const handleRevert = (version) => {
    setVersionToRevert(version);
    setShowRevertConfirm(true);
  };

  const confirmRevert = () => {
    if (versionToRevert && onRevert) {
      onRevert(versionToRevert.id);
      setShowRevertConfirm(false);
      setVersionToRevert(null);
    }
  };

  const getVersionType = (version) => {
    if (version.isMajor) return { label: 'MAJOR', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    if (version.isMinor) return { label: 'MINOR', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
    return { label: 'PATCH', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
  };

  const DiffModal = () => {
    if (!selectedDiff) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Diff className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Version Comparison
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Comparing changes between versions
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowDiffModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Diff Content */}
          <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
            <div className="grid grid-cols-2 gap-6">
              {/* Previous Version */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-red-600 dark:text-red-400">Before</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(selectedDiff.previous.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-2 border-red-200 dark:border-red-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Changes Removed:
                  </div>
                  {selectedDiff.previous.changes?.map((change, idx) => (
                    <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 py-1 line-through opacity-70">
                      {change}
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Version */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">After</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(selectedDiff.current.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Changes Added:
                  </div>
                  {selectedDiff.current.changes?.map((change, idx) => (
                    <div key={idx} className="text-sm text-gray-700 dark:text-gray-300 py-1">
                      {change}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {selectedDiff.current.notes && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  Version Notes:
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedDiff.current.notes}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedDiff.current.changes?.length || 0} changes detected
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
              {canRevert && (
                <button
                  onClick={() => {
                    handleRevert(selectedDiff.previous);
                    setShowDiffModal(false);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateLeft className="w-4 h-4" />
                  Revert to This Version
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Version History
          </h3>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {versions.length} versions
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-500 via-purple-400 to-purple-300 dark:from-purple-600 dark:via-purple-500 dark:to-purple-400" />

        {/* Version Items */}
        <div className="space-y-4">
          {versions.map((version, index) => {
            const isCurrent = version.id === currentVersionId;
            const versionType = getVersionType(version);
            const isExpanded = expandedVersion === version.id;
            const isLatest = index === 0;

            return (
              <div
                key={version.id}
                className={`relative pl-16 ${
                  isCurrent ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 rounded-xl -mx-2 px-2 py-2' : ''
                }`}
              >
                {/* Version Indicator */}
                <div className={`absolute left-6 top-4 w-5 h-5 rounded-full flex items-center justify-center ${
                  isCurrent
                    ? 'bg-purple-600 dark:bg-purple-500 text-white scale-110'
                    : 'bg-white dark:bg-gray-800 border-2 border-purple-400 dark:border-purple-500'
                }`}>
                  {isCurrent ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <GitCommit className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>

                {/* Version Card */}
                <div className={`bg-white dark:bg-gray-800 rounded-lg border ${
                  isCurrent
                    ? 'border-purple-500 shadow-lg shadow-purple-500/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors'
                }`}>
                  {/* Version Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${versionType.color}`}>
                              {versionType.label}
                            </span>
                            {isCurrent && (
                              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                Current
                              </span>
                            )}
                            {isLatest && !isCurrent && (
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {version.title || `Version ${versions.length - index}`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {getRelativeTime(version.createdAt)}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(version.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Version Summary */}
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <User className="w-3.5 h-3.5" />
                        <span>{version.author?.name || version.author}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{version.changes?.length || 0} changes</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                        {/* Changes List */}
                        {version.changes && version.changes.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                              Changes:
                            </div>
                            <ul className="space-y-1">
                              {version.changes.map((change, idx) => (
                                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                  <span className="text-purple-500 dark:text-purple-400 mt-0.5">•</span>
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Version Notes */}
                        {version.notes && (
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              Notes:
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {version.notes}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          {!isCurrent && index < versions.length - 1 && (
                            <button
                              onClick={() => handleViewDiff(version)}
                              className="text-sm flex items-center gap-1 px-3 py-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Diff
                            </button>
                          )}
                          {!isCurrent && canRevert && (
                            <button
                              onClick={() => handleRevert(version)}
                              className="text-sm flex items-center gap-1 px-3 py-1.5 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                            >
                              <RotateLeft className="w-3.5 h-3.5" />
                              Revert to This
                            </button>
                          )}
                          {version.notes && onAddNote && (
                            <button
                              onClick={() => onAddNote(version.id)}
                              className="text-sm flex items-center gap-1 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Add Note
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Diff Modal */}
      {showDiffModal && <DiffModal />}

      {/* Revert Confirmation Modal */}
      {showRevertConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Confirm Revert
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Are you sure you want to revert to version{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {versionToRevert?.title || versionToRevert?.id}
                </span>
                ? This will create a new version based on the selected one.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowRevertConfirm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRevert}
                  className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <RotateLeft className="w-4 h-4" />
                  Confirm Revert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionTimeline;