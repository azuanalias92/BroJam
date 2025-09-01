export default function TestPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <div>
      <h1>Test Page Works!</h1>
      <p>This is a test page to verify routing is working.</p>
    </div>
  );
}