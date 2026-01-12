export const COLOR_THEMES = [
  {
    id: 'pastel',
    name: 'Pastel',
    colors: ['#BFDBFE', '#FECACA', '#BBF7D0', '#FEF08A', '#DDD6FE', '#FBCFE8', '#CFFAFE', '#FED7AA', '#99F6E4', '#E2E8F0']
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    colors: ['#F3F4F6', '#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#1F2937', '#111827', '#F9FAFB']
  }
];

export const getThemeColors = (themeId) => {
  const theme = COLOR_THEMES.find(t => t.id === themeId);
  return theme ? theme.colors : COLOR_THEMES[0].colors;
};
