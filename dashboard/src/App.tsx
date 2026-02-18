import { PortfolioCard } from "@/components/PortfolioCard"
import "./App.css"

function App() {
  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customer portfolio overview
          </p>
        </header>
        <PortfolioCard />
      </div>
    </div>
  )
}

export default App
