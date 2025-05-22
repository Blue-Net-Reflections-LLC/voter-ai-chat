import { FilterSectionKey, SectionColorConfigValue } from './types';

export const sectionColorConfig: Record<FilterSectionKey, SectionColorConfigValue> = {
  participationScore: {
    badge: "bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 border border-teal-300 dark:border-teal-600",
    accordionTriggerClasses: "bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-200 hover:bg-teal-200 dark:hover:bg-teal-700 dark:hover:text-teal-100",
    countBubble: "bg-teal-500 dark:bg-teal-600 text-white dark:text-teal-100",
  },
  counties: {
    badge: "bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200 border border-orange-300 dark:border-orange-600",
    accordionTriggerClasses: "bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-700 dark:hover:text-orange-100",
    countBubble: "bg-orange-500 dark:bg-orange-600 text-white dark:text-orange-100",
  },
  geographic: {
    badge: "bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 border border-sky-300 dark:border-sky-600",
    accordionTriggerClasses: "bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-200 hover:bg-sky-200 dark:hover:bg-sky-700 dark:hover:text-sky-100",
    countBubble: "bg-sky-500 dark:bg-sky-600 text-white dark:text-sky-100",
  },
  districts: {
    badge: "bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-600",
    accordionTriggerClasses: "bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-200 hover:bg-rose-200 dark:hover:bg-rose-700 dark:hover:text-rose-100",
    countBubble: "bg-rose-500 dark:bg-rose-600 text-white dark:text-rose-100",
  },
  voterInfo: {
    badge: "bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-600",
    accordionTriggerClasses: "bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-700 dark:hover:text-emerald-100",
    countBubble: "bg-emerald-500 dark:bg-emerald-600 text-white dark:text-emerald-100",
  },
  demographics: {
    badge: "bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 border border-purple-300 dark:border-purple-600",
    accordionTriggerClasses: "bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-700 dark:hover:text-purple-100",
    countBubble: "bg-purple-500 dark:bg-purple-600 text-white dark:text-purple-100",
  },
  votingHistory: {
    badge: "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 border border-amber-300 dark:border-amber-600",
    accordionTriggerClasses: "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-700 dark:hover:text-amber-100",
    countBubble: "bg-amber-500 dark:bg-amber-600 text-white dark:text-amber-100",
  },
  census: {
    badge: "bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-600",
    accordionTriggerClasses: "bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-700 dark:hover:text-indigo-100",
    countBubble: "bg-indigo-500 dark:bg-indigo-600 text-white dark:text-indigo-100",
  },
}; 