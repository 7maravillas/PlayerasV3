/**
 * Login page has its own layout — no sidebar, no guard.
 * This prevents infinite redirect loops (guard → login → guard).
 */
export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
