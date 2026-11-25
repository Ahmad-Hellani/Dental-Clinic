import { Link } from "react-router-dom";
import { Button } from "../components/atoms/Button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-serif text-6xl font-bold text-brand-700">404</p>
      <h1>Page not found</h1>
      <p className="text-ink-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/"><Button>Back to home</Button></Link>
    </div>
  );
}
