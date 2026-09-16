import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <main className="project-not-found">
      <span>404</span>
      <h1>CASE FILE NOT FOUND</h1>
      <p>This project is unavailable, unpublished, or has moved.</p>
      <Link href="/#work">RETURN TO PROJECT SELECT</Link>
    </main>
  );
}
