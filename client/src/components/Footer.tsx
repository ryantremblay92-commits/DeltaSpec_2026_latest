export function Footer() {
  return (
    <footer className="fixed bottom-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40 h-12">
      <div className="container flex h-full items-center justify-between px-6">
        <p className="text-xs text-muted-foreground">
          DeltaSpec © 2024 • Real-time Cryptocurrency Trading Analytics
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
          <span>•</span>
          <a href="#" className="hover:text-foreground transition-colors">Support</a>
          <span>•</span>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}