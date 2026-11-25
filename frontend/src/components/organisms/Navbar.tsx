import { Link, useNavigate } from "react-router-dom";
import { homePathFor, useAuth } from "../../context/AuthContext";
import { Avatar } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";

export function Navbar({ variant = "public" }: { variant?: "public" | "app" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 font-serif text-lg font-bold text-white">S</span>
          <span className="font-serif text-lg font-bold">Smile Clinic</span>
        </Link>

        {variant === "public" && (
          <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex" aria-label="Main">
            <a href="/#treatments" className="hover:text-ink">Treatments</a>
            <a href="/#dentists" className="hover:text-ink">Our dentists</a>
            <a href="/#how-it-works" className="hover:text-ink">How it works</a>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {variant === "public" && (
                <Link to={homePathFor(user.role)}>
                  <Button size="sm">My dashboard</Button>
                </Link>
              )}
              <div className="ml-2 hidden items-center gap-2 sm:flex">
                <Avatar name={user.fullName} size="sm" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold">{user.fullName}</p>
                  <Badge tone="brand" className="!px-2 !py-0 text-[10px]">{user.role}</Badge>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="secondary" size="sm">Log in</Button></Link>
              <Link to="/register"><Button size="sm">Book a visit</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
