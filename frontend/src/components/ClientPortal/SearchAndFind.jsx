import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  CaseSensitive,
  Filter,
} from "lucide-react";

/**
 * SearchAndFind Component
 *
 * Global search functionality:
 * - Highlight matches in text
 * - Navigation arrows (next/prev match)
 * - Match count display
 * - Filter by section
 * - Case-sensitive toggle
 */

const SearchAndFind = ({
  content,
  sections = [],
  onHighlightMatch,
  onScrollToMatch,
}) => {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [matches, setMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [selectedSection, setSelectedSection] = useState("all");
  const searchInputRef = useRef(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded) {
      searchInputRef.current?.focus();
    }
  }, [isExpanded]);

  // Search for matches
  useEffect(() => {
    if (!query.trim()) {
      setMatches([]);
      setCurrentMatchIndex(0);
      onHighlightMatch?.([]);
      return;
    }

    const searchQuery = isCaseSensitive ? query : query.toLowerCase();
    let foundMatches = [];
    let offset = 0;

    // Search in content
    const searchContent = isCaseSensitive ? content : content.toLowerCase();
    let searchIndex = 0;

    while (searchIndex < searchContent.length) {
      const matchIndex = searchContent.indexOf(searchQuery, searchIndex);
      if (matchIndex === -1) break;

      foundMatches.push({
        index: matchIndex,
        text: content.substring(matchIndex, matchIndex + query.length),
      });

      searchIndex = matchIndex + query.length;
    }

    // Filter by section if selected
    if (selectedSection !== "all") {
      const section = sections.find((s) => s.id === selectedSection);
      if (section) {
        const sectionStart = content.indexOf(section.content);
        const sectionEnd = sectionStart + section.content.length;
        foundMatches = foundMatches.filter(
          (match) => match.index >= sectionStart && match.index < sectionEnd
        );
      }
    }

    setMatches(foundMatches);
    setCurrentMatchIndex(0);

    // Notify parent component
    onHighlightMatch?.(foundMatches);

    // Scroll to first match
    if (foundMatches.length > 0 && onScrollToMatch) {
      onScrollToMatch(foundMatches[0]);
    }
  }, [query, content, isCaseSensitive, selectedSection, sections]);

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const newIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(newIndex);
    onScrollToMatch?.(matches[newIndex]);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const newIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(newIndex);
    onScrollToMatch?.(matches[newIndex]);
  };

  const clearSearch = () => {
    setQuery("");
    setMatches([]);
    setCurrentMatchIndex(0);
    onHighlightMatch?.([]);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Escape") {
      setIsExpanded(false);
      clearSearch();
    } else if (e.key === "Enter") {
      handleNextMatch();
    }
  };

  return (
    <div className="relative">
      {/* Search Bar */}
      <div
        className={`
          flex items-center gap-2 bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          rounded-xl overflow-hidden transition-all duration-300
          ${isExpanded ? "w-full shadow-lg" : "w-64"}
        `}
      >
        {/* Search Input Container */}
        <div className="flex-1 flex items-center">
          <div className="pl-3">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search in document..."
            className="
              flex-1 px-3 py-2 bg-transparent border-0 focus:outline-none
              text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            "
          />
          {query && (
            <button
              onClick={clearSearch}
              className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}
        </div>

        {/* Expand/Collapse Toggle */}
        <button
          onClick={toggleExpand}
          className="
            px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700
            border-l border-gray-300 dark:border-gray-600 transition-colors
          "
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2
            bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
            rounded-xl shadow-lg p-4 space-y-3 z-20
          "
        >
          {/* Match Count & Navigation */}
          {matches.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {currentMatchIndex + 1} of {matches.length}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevMatch}
                    className="
                      p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700
                      rounded-lg transition-colors
                    "
                    aria-label="Previous match"
                  >
                    <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={handleNextMatch}
                    className="
                      p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700
                      rounded-lg transition-colors
                    "
                    aria-label="Next match"
                  >
                    <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Case Sensitive Toggle */}
              <button
                onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
                  ${
                    isCaseSensitive
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }
                `}
              >
                <CaseSensitive className="w-4 h-4" />
                <span className="text-sm">Case Sensitive</span>
              </button>
            </div>
          )}

          {/* No Matches Found */}
          {query && matches.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
              No matches found for "{query}"
            </div>
          )}

          {/* Section Filter */}
          {sections.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Filter by section:
                </span>
              </div>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="
                  w-full px-3 py-2 bg-gray-50 dark:bg-gray-900
                  border border-gray-300 dark:border-gray-600 rounded-lg
                  text-gray-900 dark:text-white text-sm focus:outline-none
                  focus:ring-2 focus:ring-purple-500
                "
              >
                <option value="all">All Sections</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Keyboard Shortcuts */}
          <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
            <span className="mr-3">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                Enter
              </kbd>{" "}
              Next
            </span>
            <span className="mr-3">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                Shift
              </kbd>
              +
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                Enter
              </kbd>{" "}
              Prev
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                Esc
              </kbd>{" "}
              Close
            </span>
          </div>
        </div>
      )}

      {/* Match Highlights Overlay (if parent provides callback) */}
      {matches.length > 0 && !isExpanded && (
        <div
          className="
            absolute right-12 top-1/2 -translate-y-1/2
            px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30
            text-purple-700 dark:text-purple-300 text-xs font-semibold rounded
          "
        >
          {matches.length}
        </div>
      )}
    </div>
  );
};

export default SearchAndFind;
