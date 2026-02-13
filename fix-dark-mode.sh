#!/bin/bash
# Comprehensive dark mode fix for all portal-app components

# Fix globals.css - soften dark background slightly
sed -i '' 's/--background: 240 15% 8%;/--background: 220 15% 9%;/' app/globals.css

# Add transition-colors to body for smooth dark mode toggle
sed -i '' 's/@apply bg-background text-foreground;/@apply bg-background text-foreground transition-colors duration-200;/' app/globals.css

# ============================================
# PATTERN: bg-{color}-50 → bg-{color}-50 dark:bg-{color}-900/20
# ============================================
FILES=$(find components -name "*.tsx")

for f in $FILES; do
  # bg-purple-50 (not already having dark:)
  sed -i '' "s/bg-purple-50\([^'\"]*\)dark:bg-purple/bg-purple-50\1dark:bg-purple/g" "$f"  # skip already fixed
  sed -i '' "s/bg-purple-50 border border-purple-100/bg-purple-50 dark:bg-purple-900\/20 border border-purple-100 dark:border-purple-800/g" "$f"
  sed -i '' "s/bg-purple-50 rounded-xl p-4 border border-purple-100/bg-purple-50 dark:bg-purple-900\/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/g" "$f"
  sed -i '' "s/bg-purple-50 rounded-xl p-6/bg-purple-50 dark:bg-purple-900\/20 rounded-xl p-6/g" "$f"
  sed -i '' "s/bg-purple-50 rounded-2xl/bg-purple-50 dark:bg-purple-900\/20 rounded-2xl/g" "$f"
  sed -i '' "s/bg-purple-50 text-purple-600/bg-purple-50 dark:bg-purple-900\/30 text-purple-600 dark:text-purple-400/g" "$f"
  sed -i '' "s/bg-purple-50\/50/bg-purple-50\/50 dark:bg-purple-900\/20/g" "$f"
  
  # bg-emerald-50
  sed -i '' "s/bg-emerald-50 border border-emerald-100/bg-emerald-50 dark:bg-emerald-900\/20 border border-emerald-100 dark:border-emerald-800/g" "$f"
  sed -i '' "s/bg-emerald-50 rounded-xl p-4 border border-emerald-100/bg-emerald-50 dark:bg-emerald-900\/20 rounded-xl p-4 border border-emerald-100 dark:border-emerald-800/g" "$f"
  sed -i '' "s/bg-emerald-50 text-emerald-600/bg-emerald-50 dark:bg-emerald-900\/30 text-emerald-600 dark:text-emerald-400/g" "$f"
  
  # bg-teal-50
  sed -i '' "s/bg-teal-50 border border-teal-100/bg-teal-50 dark:bg-teal-900\/20 border border-teal-100 dark:border-teal-800/g" "$f"
  sed -i '' "s/bg-teal-50 rounded-xl p-4 border border-teal-100/bg-teal-50 dark:bg-teal-900\/20 rounded-xl p-4 border border-teal-100 dark:border-teal-800/g" "$f"
  sed -i '' "s/bg-teal-50 rounded-xl p-6/bg-teal-50 dark:bg-teal-900\/20 rounded-xl p-6/g" "$f"
  sed -i '' "s/bg-teal-50 text-teal-600/bg-teal-50 dark:bg-teal-900\/30 text-teal-600 dark:text-teal-400/g" "$f"
  sed -i '' "s/bg-teal-50 text-teal-700/bg-teal-50 dark:bg-teal-900\/30 text-teal-700 dark:text-teal-300/g" "$f"

  # bg-sky-50
  sed -i '' "s/bg-sky-50 border border-sky-100/bg-sky-50 dark:bg-sky-900\/20 border border-sky-100 dark:border-sky-800/g" "$f"
  sed -i '' "s/bg-sky-50 rounded-xl p-6/bg-sky-50 dark:bg-sky-900\/20 rounded-xl p-6/g" "$f"

  # bg-red-50
  sed -i '' "s/bg-red-50 border border-red-200/bg-red-50 dark:bg-red-900\/20 border border-red-200 dark:border-red-800/g" "$f"
  sed -i '' "s/bg-red-50 border border-red-100/bg-red-50 dark:bg-red-900\/20 border border-red-100 dark:border-red-800/g" "$f"
  sed -i '' "s/bg-red-50 rounded-xl p-4 border border-red-100/bg-red-50 dark:bg-red-900\/20 rounded-xl p-4 border border-red-100 dark:border-red-800/g" "$f"
  sed -i '' "s/bg-red-50 text-red-600/bg-red-50 dark:bg-red-900\/30 text-red-600 dark:text-red-400/g" "$f"
  sed -i '' "s/bg-red-50 text-red-500/bg-red-50 dark:bg-red-900\/30 text-red-500 dark:text-red-400/g" "$f"
  
  # bg-amber-50
  sed -i '' "s/bg-amber-50 border border-amber-100/bg-amber-50 dark:bg-amber-900\/20 border border-amber-100 dark:border-amber-800/g" "$f"
  sed -i '' "s/bg-amber-50 rounded-xl p-4 border border-amber-100/bg-amber-50 dark:bg-amber-900\/20 rounded-xl p-4 border border-amber-100 dark:border-amber-800/g" "$f"
  sed -i '' "s/bg-amber-50 text-amber-600/bg-amber-50 dark:bg-amber-900\/30 text-amber-600 dark:text-amber-400/g" "$f"

  # bg-green-50
  sed -i '' "s/bg-green-50 text-green-600/bg-green-50 dark:bg-green-900\/30 text-green-600 dark:text-green-400/g" "$f"
  sed -i '' "s/bg-green-50 border border-green-200/bg-green-50 dark:bg-green-900\/20 border border-green-200 dark:border-green-800/g" "$f"
  
  # bg-blue-50
  sed -i '' "s/bg-blue-50 border border-blue-200/bg-blue-50 dark:bg-blue-900\/20 border border-blue-200 dark:border-blue-800/g" "$f"
  sed -i '' "s/bg-blue-50 text-blue-600/bg-blue-50 dark:bg-blue-900\/30 text-blue-600 dark:text-blue-400/g" "$f"

  # bg-orange-50
  sed -i '' "s/bg-orange-50 text-orange-600/bg-orange-50 dark:bg-orange-900\/30 text-orange-600 dark:text-orange-400/g" "$f"
  sed -i '' "s/bg-orange-100 text-orange-700/bg-orange-100 dark:bg-orange-900\/30 text-orange-700 dark:text-orange-300/g" "$f"

  # bg-*-100 patterns for pills/badges
  sed -i '' "s/bg-purple-100 text-purple-700/bg-purple-100 dark:bg-purple-900\/40 text-purple-700 dark:text-purple-300/g" "$f"
  sed -i '' "s/bg-blue-100 text-blue-700/bg-blue-100 dark:bg-blue-900\/40 text-blue-700 dark:text-blue-300/g" "$f"
  sed -i '' "s/bg-green-100 text-green-700/bg-green-100 dark:bg-green-900\/40 text-green-700 dark:text-green-300/g" "$f"
  
  # bg-gray-100 (common)
  sed -i '' "s/'bg-gray-100 text-gray-500'/'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'/g" "$f"
  sed -i '' "s/'bg-gray-100'/'bg-gray-100 dark:bg-gray-800'/g" "$f"
  
  # bg-purple-100 standalone (icon backgrounds)
  sed -i '' "s/'bg-purple-100'/'bg-purple-100 dark:bg-purple-900\/40'/g" "$f"
  
  # bg-teal-100 standalone
  sed -i '' "s/'bg-teal-100'/'bg-teal-100 dark:bg-teal-900\/40'/g" "$f"

  # Status colors with bg-*-50 in getStatusColor
  sed -i '' "s/text-green-500 bg-green-50/text-green-500 bg-green-50 dark:bg-green-900\/20/g" "$f"
  sed -i '' "s/text-yellow-500 bg-yellow-50/text-yellow-500 bg-yellow-50 dark:bg-yellow-900\/20/g" "$f"
  sed -i '' "s/text-gray-500 bg-gray-50/text-gray-500 bg-gray-50 dark:bg-gray-800/g" "$f"

  # text-purple-700 → dark variant
  sed -i '' "s/text-purple-700\"/text-purple-700 dark:text-purple-300\"/g" "$f"
  sed -i '' "s/text-emerald-700\"/text-emerald-700 dark:text-emerald-300\"/g" "$f"
  sed -i '' "s/text-sky-700\"/text-sky-700 dark:text-sky-300\"/g" "$f"
  sed -i '' "s/text-teal-700\"/text-teal-700 dark:text-teal-300\"/g" "$f"
  sed -i '' "s/text-purple-500 mt-1/text-purple-500 dark:text-purple-400 mt-1/g" "$f"
  sed -i '' "s/text-emerald-500 mt-1/text-emerald-500 dark:text-emerald-400 mt-1/g" "$f"
  
  # border-*-100 → dark variants  
  sed -i '' "s/border-purple-100 flex/border-purple-100 dark:border-purple-800 flex/g" "$f"
  sed -i '' "s/border-teal-100\">/border-teal-100 dark:border-teal-800\">/g" "$f"

  # hover:bg-red-50
  sed -i '' "s/hover:bg-red-50/hover:bg-red-50 dark:hover:bg-red-900\/20/g" "$f"
  sed -i '' "s/hover:bg-blue-100/hover:bg-blue-100 dark:hover:bg-blue-900\/40/g" "$f"
  sed -i '' "s/hover:bg-red-100/hover:bg-red-100 dark:hover:bg-red-900\/40/g" "$f"
  sed -i '' "s/hover:bg-purple-200/hover:bg-purple-200 dark:hover:bg-purple-800\/40/g" "$f"
  sed -i '' "s/hover:bg-yellow-200/hover:bg-yellow-200 dark:hover:bg-yellow-800\/40/g" "$f"
  sed -i '' "s/hover:bg-green-200/hover:bg-green-200 dark:hover:bg-green-800\/40/g" "$f"
done

echo "Dark mode fix complete"
