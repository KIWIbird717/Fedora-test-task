import {
  Button,
  Monitor,
  Moon,
  Sun,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@fedora-meetings/web-ui';
import {
  cycleColorSchemePreference,
  useColorScheme,
  type ColorSchemePreference,
} from '../model/color-scheme.store';

const PREFERENCE_LABEL: Record<ColorSchemePreference, string> = {
  system: 'Системная тема',
  light: 'Светлая тема',
  dark: 'Тёмная тема',
};

export function ColorSchemeToggle() {
  const { preference } = useColorScheme();
  const label = PREFERENCE_LABEL[preference];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`${label}. Переключить тему`}
          onClick={cycleColorSchemePreference}
        >
          {preference === 'dark' ? (
            <Moon />
          ) : preference === 'light' ? (
            <Sun />
          ) : (
            <Monitor />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
