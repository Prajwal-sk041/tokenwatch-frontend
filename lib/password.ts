export const PASSWORD_REQUIREMENTS = "At least 5 characters with one uppercase letter, one number, and one special character.";

export function passwordError(password: string): string | null {
  if (password.length < 5) return "Use at least 5 characters.";
  if (!/[A-Z]/.test(password)) return "Add at least one uppercase letter.";
  if (!/\d/.test(password)) return "Add at least one number.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Add at least one special character.";
  return null;
}
