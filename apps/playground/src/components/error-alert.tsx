import { Alert, AlertDescription } from '@/components/ui/alert';

/** The red banner above a form's footer; renders nothing without a message. */
export function ErrorAlert({ message }: { message: string | undefined }) {
  if (!message) return null;

  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
